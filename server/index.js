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
	const { origin, destination, date, max: maxParam } = req.query;
	const maxResults = Math.min(parseInt(maxParam) || 50, 250);

	if (!origin || !destination || !date) {
		return res.status(400).json({ error: 'origin, destination, and date are required query parameters' });
	}

	try {
		const originCity = cities.find(c => c.code === origin.toUpperCase());
		const destCity = cities.find(c => c.code === destination.toUpperCase());

		const response = await amadeus.shopping.flightOffersSearch.get({
			originLocationCode: origin.toUpperCase(),
			destinationLocationCode: destination.toUpperCase(),
			departureDate: date,
			adults: '1',
			max: maxResults,
		});

		const flightOffers = response.data;
		const dictionaries = response.result.dictionaries;

		// Fetch live EUR→COP rate (or cached)
		const eurToCop = await getEurToCopRate();

		const inventory = flightOffers.map((offer) => {
			const itinerary = offer.itineraries[0];
			const segment = itinerary.segments[0];

			const carrierCode = segment.carrierCode;
			const airlineName = dictionaries?.carriers?.[carrierCode] || carrierCode;

			const departureTimeFull = new Date(segment.departure.at);
			const arrivalTimeFull = new Date(segment.arrival.at);

			const depTime = departureTimeFull.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
			const arrTime = arrivalTimeFull.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

			const durationRaw = itinerary.duration.replace('PT', '');
			const parsedDuration = durationRaw.toLowerCase().replace('h', 'h ').replace('m', 'm');

			const priceEur = parseFloat(offer.price.total);
			const priceCOP = Math.round(priceEur * eurToCop);

			return {
				id: offer.id,
				flightNumber: `${segment.carrierCode}${segment.number}`,
				airline: segment.carrierCode,
				airlineName,
				origin: {
					code: segment.departure.iataCode,
					city: originCity ? originCity.city : segment.departure.iataCode,
				},
				destination: {
					code: segment.arrival.iataCode,
					city: destCity ? destCity.city : segment.arrival.iataCode,
				},
				date,
				departureTime: depTime,
				arrivalTime: arrTime,
				duration: parsedDuration,
				priceEur,
				priceCOP,
				exchangeRate: eurToCop,
				availableSeats: offer.numberOfBookableSeats,
				fareType: offer.travelerPricings[0]?.fareDetailsBySegment[0]?.cabin || 'ECONOMY',
				baggageIncluded: offer.pricingOptions?.includedCheckedBagsOnly || false,
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

// Get active config
app.get('/api/tracking/config', async (req, res) => {
	try {
		const config = await prisma.trackingConfig.findFirst({
			where: { isActive: true }
		});
		res.json(config);
	} catch (error) {
		res.status(500).json({ error: 'Database error' });
	}
});

// Set/update tracking config (Only 1 active at a time for simplicity)
app.post('/api/tracking/config', async (req, res) => {
	const { origin, destination, startDate, endDate } = req.body;
	if (!origin || !destination || !startDate || !endDate) {
		return res.status(400).json({ error: 'Missing parameters' });
	}

	try {
		// Deactivate all previous configs to protect quota (1 active only)
		await prisma.trackingConfig.updateMany({
			where: { isActive: true },
			data: { isActive: false }
		});

		const newConfig = await prisma.trackingConfig.create({
			data: { origin, destination, startDate, endDate, isActive: true }
		});

		// Run job immediately to get initial data
		const { runTrackerJob } = require('./cron');
		runTrackerJob().catch(console.error);

		res.json(newConfig);
	} catch (error) {
		console.error('Error saving tracking config:', error);
		res.status(500).json({ error: 'Database error while saving config' });
	}
});

// Delete/deactivate active tracking config
app.delete('/api/tracking/config', async (req, res) => {
	try {
		const updated = await prisma.trackingConfig.updateMany({
			where: { isActive: true },
			data: { isActive: false }
		});
		if (updated.count === 0) {
			return res.status(404).json({ error: 'No active tracking config found' });
		}
		console.log('🛑 Tracking config deactivated.');
		res.json({ message: 'Tracking stopped', deactivated: updated.count });
	} catch (error) {
		console.error('Error deactivating tracking config:', error);
		res.status(500).json({ error: 'Database error while deactivating config' });
	}
});

// Get price history for active config
app.get('/api/tracking/history', async (req, res) => {
	try {
		const config = await prisma.trackingConfig.findFirst({
			where: { isActive: true },
			include: {
				priceHistory: {
					orderBy: { recordedAt: 'asc' }
				}
			}
		});
		if (!config) return res.json({ history: {} });

		// Group by target flight date
		const grouped = config.priceHistory.reduce((acc, curr) => {
			if (!acc[curr.dateChecked]) acc[curr.dateChecked] = [];
			acc[curr.dateChecked].push(curr);
			return acc;
		}, {});

		res.json({ config, history: grouped });
	} catch (error) {
		res.status(500).json({ error: 'Database error fetching history' });
	}
});

app.listen(PORT, () => {
	console.log(`🛫 SkyTracker API running at http://localhost:${PORT}`);
	console.log(`   GET /api/cities  — Available cities`);
	console.log(`   GET /api/search  — Search flight inventory & prices`);
});
