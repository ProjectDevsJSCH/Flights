const API_BASE = '/api';

export async function fetchCities() {
	const res = await fetch(`${API_BASE}/cities`);
	if (!res.ok) throw new Error('Failed to fetch cities');
	return res.json();
}

export async function searchFlights(origin, destination, date, max = 50) {
	const params = new URLSearchParams({ origin, destination, date, max });
	const res = await fetch(`${API_BASE}/search?${params.toString()}`);
	if (!res.ok) throw new Error('Failed to search flights');
	return res.json();
}
