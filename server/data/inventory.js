const airlines = require('./airlines');
const { cities } = require('./flights');

// Generate 3-8 flights for a given route and date
function searchInventory(originCode, destinationCode, dateStr) {
	const inventory = [];
	const today = new Date();
	const searchDate = new Date(dateStr);

	// Basic validation that origin and dest exist, otherwise default to BOG and MDE
	const origin = cities.find(c => c.code === originCode) || cities.find(c => c.code === 'BOG');
	const destination = cities.find(c => c.code === destinationCode) || cities.find(c => c.code === 'MDE');

	const numFlights = 3 + Math.floor(Math.random() * 5); // 3-8 flights

	for (let i = 0; i < numFlights; i++) {
		// Pick a random airline, but weight slightly towards legacy carriers
		const airlineChoices = [
			...airlines,
			airlines.find(a => a.id === 'avianca'),
			airlines.find(a => a.id === 'latam')
		];
		const airline = airlineChoices[Math.floor(Math.random() * airlineChoices.length)];

		// Flight duration logic based loosely on location (random 1-5h for demo)
		const flightDurationHours = 1 + Math.floor(Math.random() * 4);
		const flightDurationMins = Math.floor(Math.random() * 60);

		// Departure time
		const depHour = 5 + Math.floor(Math.random() * 18); // 05:00 - 22:00
		const depMin = Math.floor(Math.random() * 12) * 5; // Every 5 mins
		const depTime = `${String(depHour).padStart(2, '0')}:${String(depMin).padStart(2, '0')}`;

		// Arrival time
		let arrHour = depHour + flightDurationHours;
		let arrMin = depMin + flightDurationMins;
		if (arrMin >= 60) {
			arrHour++;
			arrMin -= 60;
		}
		if (arrHour >= 24) arrHour -= 24;
		const arrTime = `${String(arrHour).padStart(2, '0')}:${String(arrMin).padStart(2, '0')}`;

		// Pricing Logic
		// Base price in USD
		let basePrice = 50 + Math.floor(Math.random() * 100);

		// Low cost carriers (Wingo, JetSmart) are generally cheaper
		if (airline.id === 'wingo' || airline.id === 'jetsmart') {
			basePrice = Math.max(30, basePrice - 30);
		} else {
			// Legacy carriers (Avianca, LATAM) generally more expensive
			basePrice += 40;
		}

		// Last minute flights are more expensive
		const daysUntilNextFlight = Math.max(0, Math.floor((searchDate - today) / (1000 * 60 * 60 * 24)));
		if (daysUntilNextFlight < 7) {
			basePrice += (7 - daysUntilNextFlight) * 15;
		} else if (daysUntilNextFlight > 30) {
			basePrice = Math.max(40, basePrice * 0.8); // 20% discount for early booking
		}

		// Availability
		const totalSeats = 180;
		// Closer to date = fewer seats
		let availableSeats = Math.floor(Math.random() * 50) + 1;
		if (daysUntilNextFlight > 14) availableSeats += 40;

		inventory.push({
			id: `INV-${Date.now()}-${i}`,
			flightNumber: `${airline.iataCode}${Math.floor(Math.random() * 9000) + 100}`,
			airline: airline.id,
			airlineName: airline.name,
			airlineColor: airline.color,
			origin: {
				code: origin.code,
				city: origin.name,
			},
			destination: {
				code: destination.code,
				city: destination.name,
			},
			date: dateStr,
			departureTime: depTime,
			arrivalTime: arrTime,
			duration: `${flightDurationHours}h ${flightDurationMins}m`,
			priceUSD: Math.floor(basePrice),
			priceCOP: Math.floor(basePrice * 4000), // Approximate mock conversion
			availableSeats: availableSeats,
			fareType: (airline.id === 'wingo' || airline.id === 'jetsmart') ? 'Basic' : 'Economy',
			baggageIncluded: (airline.id === 'avianca' || airline.id === 'latam'),
		});
	}

	// Sort by departure time by default
	return inventory.sort((a, b) => a.departureTime.localeCompare(b.departureTime));
}

module.exports = { searchInventory };
