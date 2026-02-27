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
					<div className="hero-eyebrow">✈ Con tecnología de Amadeus</div>
					<h1 className="hero-title">
						Encuentra los mejores vuelos<br />
						<span>con precios en tiempo real</span>
					</h1>
					<p className="hero-subtitle">
						Busca y compara vuelos entre aerolíneas principales.
						Precios reales y disponibilidad en vivo.
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
							color: activeTab === 'search' ? 'var(--bg-primary)' : 'var(--text-secondary)',
							border: '1px solid var(--border-color)',
							cursor: 'pointer',
							fontSize: '0.9rem',
							fontWeight: 600,
							transition: 'all 0.2s'
						}}
					>
						Búsqueda en vivo
					</button>
					<button
						onClick={() => setActiveTab('track')}
						style={{
							padding: '0.6rem 2rem',
							borderRadius: 'var(--radius-full)',
							background: activeTab === 'track' ? 'var(--accent-indigo)' : 'var(--bg-glass)',
							color: activeTab === 'track' ? 'var(--bg-primary)' : 'var(--text-secondary)',
							border: '1px solid var(--border-color)',
							cursor: 'pointer',
							fontSize: '0.9rem',
							fontWeight: 600,
							transition: 'all 0.2s'
						}}
					>
						Monitor por hora
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
						<span>Datos vía API de Amadeus</span>
					</div>
				</div>
			</footer>
		</>
	);
}
