const cron = require('node-cron');
const { PrismaClient } = require('@prisma/client');
const Amadeus = require('amadeus');
const prisma = new PrismaClient();
const cities = require('./data/cities');

const isProd = process.env.NODE_ENV === 'production';
const amadeus = new Amadeus({
	clientId: isProd ? process.env.AMADEUS_CLIENT_ID_PROD : process.env.AMADEUS_CLIENT_ID_TEST,
	clientSecret: isProd ? process.env.AMADEUS_CLIENT_SECRET_PROD : process.env.AMADEUS_CLIENT_SECRET_TEST,
	hostname: isProd ? 'production' : 'test'
});

// ---- Telegram Notification ----
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

function getCityName(code) {
	const city = cities.find(c => c.code === code);
	return city ? city.city : code;
}

function formatCOP(value) {
	return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

async function sendTelegramMessage(text) {
	if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
		console.log('⚠️  Telegram not configured, skipping notification.');
		return;
	}
	try {
		const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
		const res = await fetch(url, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				chat_id: TELEGRAM_CHAT_ID,
				text,
				parse_mode: 'HTML',
			}),
		});
		if (!res.ok) {
			const err = await res.text();
			console.error('Telegram API error:', err);
		} else {
			console.log('📨 Telegram notification sent.');
		}
	} catch (err) {
		console.error('Failed to send Telegram message:', err.message);
	}
}

// Fetch EUR to COP rate
let rateCache = { rate: null, fetchedAt: null };
async function getEurToCopRate() {
	const now = Date.now();
	const ONE_HOUR = 60 * 60 * 1000;
	if (rateCache.rate && rateCache.fetchedAt && (now - rateCache.fetchedAt) < ONE_HOUR) {
		return rateCache.rate;
	}
	try {
		const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=COP');
		if (res.ok) {
			const data = await res.json();
			rateCache = { rate: data.rates.COP, fetchedAt: now };
			return rateCache.rate;
		}
	} catch (err) { }
	return rateCache.rate || 4350;
}

// Helper to get dates array between start and end date (max 7 days)
function getDatesInRange(startDateStr, endDateStr) {
	const dates = [];
	let current = new Date(startDateStr);
	const end = new Date(endDateStr);
	let count = 0;

	// Ensure we don't query more than 7 days to protect API limits
	while (current <= end && count < 7) {
		dates.push(current.toISOString().split('T')[0]);
		current.setDate(current.getDate() + 1);
		count++;
	}
	return dates;
}

// Background Job - Runs at 06:00, 13:00, and 22:30
const trackerSchedules = ['0 6,13 * * *', '30 22 * * *'];

trackerSchedules.forEach((schedule) => {
	cron.schedule(schedule, async () => {
		console.log(`🕒 Running scheduled background flight tracker (${schedule})...`);
		await runTrackerJob();
	});
});

async function runTrackerJob() {
	try {
		const configs = await prisma.trackingConfig.findMany({ where: { isActive: true } });
		if (configs.length === 0) {
			console.log('No active tracking configs found.');
			return;
		}

		const eurToCop = await getEurToCopRate();

		for (const config of configs) {
			console.log(`Tracking route: ${config.origin} -> ${config.destination}`);
			const dates = getDatesInRange(config.startDate, config.endDate);

			for (const date of dates) {
				try {
					console.log(`Checking flights for ${date}...`);
					const response = await amadeus.shopping.flightOffersSearch.get({
						originLocationCode: config.origin.toUpperCase(),
						destinationLocationCode: config.destination.toUpperCase(),
						departureDate: date,
						adults: '1',
						max: 15 // Limit to 15 to find cheapest fast
					});

					const offers = response.data;
					if (!offers || offers.length === 0) continue;

					// Sort by price (cheapest first)
					offers.sort((a, b) => parseFloat(a.price.total) - parseFloat(b.price.total));
					const cheapestOffer = offers[0];

					const eurPrice = parseFloat(cheapestOffer.price.total);
					const copPrice = Math.round(eurPrice * eurToCop);

					const segment = cheapestOffer.itineraries?.[0]?.segments?.[0];
					const depTimeRaw = segment?.departure?.at;
					const departureTime = depTimeRaw ? new Date(depTimeRaw).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : '00:00';
					const airlineCode = segment?.carrierCode || 'Unknown';

					// Look up previous cheapest price for this config+date
					const previousRecord = await prisma.priceHistory.findFirst({
						where: { configId: config.id, dateChecked: date },
						orderBy: { recordedAt: 'desc' },
					});

					await prisma.priceHistory.create({
						data: {
							configId: config.id,
							dateChecked: date,
							cheapestPrice: copPrice,
							currency: "COP",
							airline: airlineCode,
							departureTime: departureTime,
							availableSeats: cheapestOffer.numberOfBookableSeats || 0
						}
					});
					console.log(`Saved lowest price for ${date}: COP ${copPrice}`);

					// Send Telegram only on price drop
					if (previousRecord && copPrice < previousRecord.cheapestPrice) {
						const diff = previousRecord.cheapestPrice - copPrice;
						const pctDrop = ((diff / previousRecord.cheapestPrice) * 100).toFixed(1);
						const originCity = getCityName(config.origin);
						const destCity = getCityName(config.destination);

						const message =
							`✈️ <b>¡Precio más bajo encontrado!</b>\n\n` +
							`🛫 <b>${originCity}</b> (${config.origin}) → <b>${destCity}</b> (${config.destination})\n` +
							`📅 Fecha: <b>${date}</b>\n` +
							`🕐 Salida: ${departureTime}\n` +
							`🏷️ Aerolínea: ${airlineCode}\n\n` +
							`💰 Precio anterior: ${formatCOP(previousRecord.cheapestPrice)}\n` +
							`💰 <b>Precio actual: ${formatCOP(copPrice)}</b>\n` +
							`📉 Bajó <b>${formatCOP(diff)}</b> (−${pctDrop}%)\n` +
							`💺 Asientos disponibles: ${cheapestOffer.numberOfBookableSeats || '?'}`;

						await sendTelegramMessage(message);
					}
				} catch (apiError) {
					console.error(`Amadeus API Error for date ${date}:`, apiError.response ? apiError.response.body : apiError.message);
				}

				// Small delay to avoid rate limiting burst
				await new Promise(resolve => setTimeout(resolve, 500));
			}
		}
		console.log('✅ Hourly tracking sync finished.');
	} catch (err) {
		console.error('Error running hourly tracking job:', err);
	}
}

// Export for use in index.js
module.exports = {
	runTrackerJob,
	sendTelegramMessage,
	getCityName,
	formatCOP
};
