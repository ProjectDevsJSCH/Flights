import { useState, useEffect } from 'react';
import BookingSearchForm from './BookingSearchForm';
import BookingResults from './BookingResults';
import { searchFlights } from '../services/api';

export default function BookingView({ cities }) {
	const [results, setResults] = useState([]);
	const [isLoading, setIsLoading] = useState(false);
	const [hasSearched, setHasSearched] = useState(false);

	const handleSearch = async (searchParams) => {
		setIsLoading(true);
		setHasSearched(true);
		try {
			const data = await searchFlights(searchParams.origin, searchParams.destination, searchParams.date);
			setResults(data.results);
		} catch (err) {
			console.error('Failed to search flights:', err);
			alert('Error al buscar vuelos');
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<>
			<BookingSearchForm
				cities={cities}
				onSearch={handleSearch}
				isLoading={isLoading}
			/>
			<BookingResults
				results={results}
				isLoading={isLoading}
				hasSearched={hasSearched}
			/>
		</>
	);
}
