require('dotenv').config({ override: false });
const express = require('express');
const cors = require('cors');
const Amadeus = require('amadeus');
const cities = require('./data/cities');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ---- Live exchange rate cache (1-hour TTL) ----
let rateCache = { rate: null, fetchedAt: null };

async function getEurToCopRate() {
	const now = Date.now();
	const ONE_HOUR = 60 * 60 * 1000;
	if (rateCache.rate && rateCache.fetchedAt && (now - rateCache.fetchedAt) < ONE_HOUR) {
		return rateCache.rate;
	}
	try {
		const res = await fetch('https://api.frankfurter.app/latest?from=EUR&to=COP');
		if (!res.ok) throw new Error('Rate fetch failed');
		const data = await res.json();
		const rate = data.rates.COP;
		rateCache = { rate, fetchedAt: now };
		console.log(`💱 EUR→COP rate refreshed: ${rate}`);
		return rate;
	} catch (err) {
		console.error('Failed to fetch exchange rate, using fallback:', err.message);
		// Fallback: approximate rate (updated Feb 2026)
		return rateCache.rate || 4350;
	}
}

// Pre-fetch rate on startup
getEurToCopRate().catch(() => { });

const app = express();
const PORT = 3001;

const isProd = process.env.NODE_ENV === 'production';

// Initialize Amadeus API client
const amadeus = new Amadeus({
	clientId: isProd ? process.env.AMADEUS_CLIENT_ID_PROD : process.env.AMADEUS_CLIENT_ID_TEST,
	clientSecret: isProd ? process.env.AMADEUS_CLIENT_SECRET_PROD : process.env.AMADEUS_CLIENT_SECRET_TEST,
	hostname: isProd ? 'production' : 'test'
});

// Middleware
app.use(cors());
app.use(express.json());

// --- API Routes ---

// Get available cities
app.get('/api/cities', (req, res) => {
	res.json(cities);
});

// Search flight inventory for booking (Using Amadeus API)
app.get('/api/search', async (req, res) => {
	const { origin, destination, date, returnDate, max: maxParam } = req.query;
	const maxResults = Math.min(parseInt(maxParam) || 50, 250);

	if (!origin || !destination || !date) {
		return res.status(400).json({ error: 'origin, destination, and date are required query parameters' });
	}

	try {
		const originCity = cities.find(c => c.code === origin.toUpperCase());
		const destCity = cities.find(c => c.code === destination.toUpperCase());

		const searchParams = {
			originLocationCode: origin.toUpperCase(),
			destinationLocationCode: destination.toUpperCase(),
			departureDate: date,
			adults: '1',
			max: maxResults,
		};

		if (returnDate) {
			searchParams.returnDate = returnDate;
		}

		const response = await amadeus.shopping.flightOffersSearch.get(searchParams);

		// Track API usage
		await prisma.apiUsage.create({
			data: { source: 'search', endpoint: 'flightOffersSearch' }
		}).catch(() => {});

		const flightOffers = response.data;
		const dictionaries = response.result.dictionaries;

		// Fetch live EUR→COP rate (or cached)
		const eurToCop = await getEurToCopRate();

		const inventory = flightOffers.map((offer) => {
			const outboundItinerary = offer.itineraries[0];
			const outboundSegment = outboundItinerary.segments[0];

			const outboundCarrierCode = outboundSegment.carrierCode;
			const outboundAirlineName = dictionaries?.carriers?.[outboundCarrierCode] || outboundCarrierCode;

			const depTimeFull = new Date(outboundSegment.departure.at);
			const arrTimeFull = new Date(outboundSegment.arrival.at);

			const depTime = depTimeFull.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
			const arrTime = arrTimeFull.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

			const outboundDuration = outboundItinerary.duration.replace('PT', '').toLowerCase().replace('h', 'h ').replace('m', 'm');

			const priceEur = parseFloat(offer.price.total);
			const priceCOP = Math.round(priceEur * eurToCop);

			let returnFlight = null;

			// Handle round-trip (if a second itinerary exists)
			if (offer.itineraries.length > 1) {
				const inboundItinerary = offer.itineraries[1];
				const inboundSegment = inboundItinerary.segments[0];

				const inboundCarrierCode = inboundSegment.carrierCode;
				const inboundAirlineName = dictionaries?.carriers?.[inboundCarrierCode] || inboundCarrierCode;

				const inboundDepTimeFull = new Date(inboundSegment.departure.at);
				const inboundArrTimeFull = new Date(inboundSegment.arrival.at);

				const inboundDepTime = inboundDepTimeFull.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
				const inboundArrTime = inboundArrTimeFull.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
				const inboundDuration = inboundItinerary.duration.replace('PT', '').toLowerCase().replace('h', 'h ').replace('m', 'm');

				returnFlight = {
					flightNumber: `${inboundSegment.carrierCode}${inboundSegment.number}`,
					airline: inboundSegment.carrierCode,
					airlineName: inboundAirlineName,
					origin: {
						code: inboundSegment.departure.iataCode,
						city: destCity ? destCity.city : inboundSegment.departure.iataCode,
					},
					destination: {
						code: inboundSegment.arrival.iataCode,
						city: originCity ? originCity.city : inboundSegment.arrival.iataCode,
					},
					departureTime: inboundDepTime,
					arrivalTime: inboundArrTime,
					duration: inboundDuration,
				};
			}

			return {
				id: offer.id,
				flightNumber: `${outboundSegment.carrierCode}${outboundSegment.number}`,
				airline: outboundSegment.carrierCode,
				airlineName: outboundAirlineName,
				origin: {
					code: outboundSegment.departure.iataCode,
					city: originCity ? originCity.city : outboundSegment.departure.iataCode,
				},
				destination: {
					code: outboundSegment.arrival.iataCode,
					city: destCity ? destCity.city : outboundSegment.arrival.iataCode,
				},
				date,
				departureTime: depTime,
				arrivalTime: arrTime,
				duration: outboundDuration,
				priceEur,
				priceCOP,
				exchangeRate: eurToCop,
				availableSeats: offer.numberOfBookableSeats,
				fareType: offer.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin || 'ECONOMY',
				baggageIncluded: offer.pricingOptions?.includedCheckedBagsOnly || false,
				returnDate,
				returnFlight
			};
		});

		inventory.sort((a, b) => a.departureTime.localeCompare(b.departureTime));

		res.json({ count: inventory.length, results: inventory, exchangeRate: eurToCop });

	} catch (error) {
		console.error('Amadeus API Error:', error.response ? error.response.body : error);
		res.status(500).json({ error: 'Failed to fetch flights from Amadeus API' });
	}
});

// --- Hourly Background Tracker Endpoints ---

// Get active configs
app.get('/api/tracking/config', async (req, res) => {
	try {
		const configs = await prisma.trackingConfig.findMany({
			where: { isActive: true }
		});
		res.json(configs);
	} catch (error) {
		res.status(500).json({ error: 'Database error' });
	}
});

// Set/update tracking config
app.post('/api/tracking/config', async (req, res) => {
	const { origin, destination, startDate, endDate } = req.body;
	if (!origin || !destination || !startDate || !endDate) {
		return res.status(400).json({ error: 'Missing parameters' });
	}

	try {

		const newConfig = await prisma.trackingConfig.create({
			data: { origin, destination, startDate, endDate, isActive: true }
		});

		// Notify via Telegram and run job immediately
		const { runTrackerJob, sendTelegramMessage, getCityName } = require('./cron');
		const originCity = getCityName(origin);
		const destCity = getCityName(destination);
		sendTelegramMessage(
			`🆕 <b>Nuevo monitoreo activado</b>\n\n` +
			`🛫 <b>${originCity}</b> (${origin}) → <b>${destCity}</b> (${destination})\n` +
			`📅 Desde: <b>${startDate}</b>\n` +
			`📅 Hasta: <b>${endDate}</b>\n\n` +
			`Se buscarán los precios más bajos automáticamente.`
		).catch(console.error);
		runTrackerJob().catch(console.error);

		res.json(newConfig);
	} catch (error) {
		console.error('Error saving tracking config:', error);
		res.status(500).json({ error: 'Database error while saving config' });
	}
});

// Edit tracking config
app.put('/api/tracking/config/:id', async (req, res) => {
	const configId = parseInt(req.params.id);
	const { origin, destination, startDate, endDate } = req.body;
	
	if (isNaN(configId)) return res.status(400).json({ error: 'Invalid ID' });
	if (!origin || !destination || !startDate || !endDate) {
		return res.status(400).json({ error: 'Missing parameters' });
	}

	try {
		// Clear old history since the date range or route changed
		await prisma.priceHistory.deleteMany({
			where: { configId: configId }
		});

		const updatedConfig = await prisma.trackingConfig.update({
			where: { id: configId },
			data: { origin, destination, startDate, endDate }
		});

		// Run job immediately to fetch initial prices for new range
		const { runTrackerJob } = require('./cron');
		runTrackerJob().catch(console.error);

		res.json(updatedConfig);
	} catch (error) {
		console.error('Error updating tracking config:', error);
		res.status(500).json({ error: 'Database error while updating config' });
	}
});

// Delete/deactivate active tracking config by ID
app.delete('/api/tracking/config/:id', async (req, res) => {
	const configId = parseInt(req.params.id);
	if (isNaN(configId)) return res.status(400).json({ error: 'Invalid ID' });

	try {
		const updated = await prisma.trackingConfig.updateMany({
			where: { id: configId, isActive: true },
			data: { isActive: false }
		});
		if (updated.count === 0) {
			return res.status(404).json({ error: 'No active tracking config found with that ID' });
		}
		console.log(`🛑 Tracking config ${configId} deactivated.`);
		res.json({ message: 'Tracking stopped', deactivated: updated.count });
	} catch (error) {
		console.error('Error deactivating tracking config:', error);
		res.status(500).json({ error: 'Database error while deactivating config' });
	}
});

// Get price history for active configs
app.get('/api/tracking/history', async (req, res) => {
	try {
		const activeConfigs = await prisma.trackingConfig.findMany({
			where: { isActive: true },
			include: {
				priceHistory: {
					orderBy: { recordedAt: 'asc' }
				}
			}
		});

		const results = activeConfigs.map(config => {
			const grouped = config.priceHistory.reduce((acc, curr) => {
				if (!acc[curr.dateChecked]) acc[curr.dateChecked] = [];
				acc[curr.dateChecked].push(curr);
				return acc;
			}, {});
			
			const { priceHistory, ...configData } = config;
			return { config: configData, history: grouped };
		});

		res.json({ results });
	} catch (error) {
		res.status(500).json({ error: 'Database error fetching history' });
	}
});

// Get API usage stats
app.get('/api/usage', async (req, res) => {
	try {
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

		const [monthlyTotal, dailyTotal, monthlyBySource] = await Promise.all([
			prisma.apiUsage.count({ where: { calledAt: { gte: startOfMonth } } }),
			prisma.apiUsage.count({ where: { calledAt: { gte: startOfDay } } }),
			prisma.apiUsage.groupBy({
				by: ['source'],
				where: { calledAt: { gte: startOfMonth } },
				_count: true
			})
		]);

		const isProd = process.env.NODE_ENV === 'production';
		const monthlyLimit = isProd ? null : 2000;
		const remaining = monthlyLimit ? monthlyLimit - monthlyTotal : null;

		const bySource = monthlyBySource.map(s => ({
			source: s.source,
			count: s._count?._all || 0
		}));

		res.json({
			monthlyTotal,
			dailyTotal,
			monthlyLimit,
			remaining,
			bySource,
			environment: isProd ? 'production' : 'test'
		});
	} catch (error) {
		console.error('Error fetching API usage:', error);
		res.status(500).json({ error: 'Failed to fetch usage stats' });
	}
});

app.listen(PORT, () => {
	console.log(`🛫 SkyTracker API running at http://localhost:${PORT}`);
	console.log(`   GET /api/cities  — Available cities`);
	console.log(`   GET /api/search  — Search flight inventory & prices`);
});
