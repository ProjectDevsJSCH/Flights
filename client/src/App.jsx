import { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import BookingView from './components/BookingView';
import TrackingView from './components/TrackingView';
import { fetchCities } from './services/api';

export default function App() {
	const [cities, setCities] = useState([]);
	const [activeTab, setActiveTab] = useState('search'); // 'search' or 'track'

	const loadData = useCallback(async () => {
		try {
			const citiesData = await fetchCities();
			setCities(citiesData);
		} catch (err) {
			console.error('Failed to load cities:', err);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	return (
		<>
			<Navbar />

			{/* Hero */}
			<div className="app-container">
				<div className="hero">
					<div className="hero-eyebrow">✈ Powered by Amadeus</div>
					<h1 className="hero-title">
						Find the best flights<br />
						<span>at real-time prices</span>
					</h1>
					<p className="hero-subtitle">
						Search and compare flights across top airlines.
						Real prices, live availability.
					</p>
				</div>
			</div>

			<main className="app-container">
				{/* Tab Navigation */}
				<div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', paddingBottom: '1.5rem' }}>
					<button
						onClick={() => setActiveTab('search')}
						style={{
							padding: '0.6rem 2rem',
							borderRadius: 'var(--radius-full)',
							background: activeTab === 'search' ? 'var(--accent-indigo)' : 'var(--bg-glass)',
							color: activeTab === 'search' ? '#fff' : 'var(--text-secondary)',
							border: '1px solid var(--border-color)',
							cursor: 'pointer',
							fontSize: '0.9rem',
							fontWeight: 600,
							transition: 'all 0.2s'
						}}
					>
						Live Search
					</button>
					<button
						onClick={() => setActiveTab('track')}
						style={{
							padding: '0.6rem 2rem',
							borderRadius: 'var(--radius-full)',
							background: activeTab === 'track' ? 'var(--accent-indigo)' : 'var(--bg-glass)',
							color: activeTab === 'track' ? '#fff' : 'var(--text-secondary)',
							border: '1px solid var(--border-color)',
							cursor: 'pointer',
							fontSize: '0.9rem',
							fontWeight: 600,
							transition: 'all 0.2s'
						}}
					>
						Hourly Tracker
					</button>
				</div>

				{activeTab === 'search' ? <BookingView cities={cities} /> : <TrackingView cities={cities} />}
			</main>

			<footer className="footer">
				<div className="app-container">
					<div className="footer-inner">
						<span>SkyTracker</span>
						<span className="footer-divider" />
						<span>Avianca</span>
						<span className="footer-divider" />
						<span>LATAM</span>
						<span className="footer-divider" />
						<span>Wingo</span>
						<span className="footer-divider" />
						<span>JetSMART</span>
						<span className="footer-divider" />
						<span>Data via Amadeus API</span>
					</div>
				</div>
			</footer>
		</>
	);
}
