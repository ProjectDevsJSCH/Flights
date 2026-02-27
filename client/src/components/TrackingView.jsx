import { useState, useEffect } from 'react';

export default function TrackingView({ cities = [] }) {
	const [config, setConfig] = useState(null);
	const [history, setHistory] = useState({});
	const [isLoading, setIsLoading] = useState(true);

	// Form specific state
	const [origin, setOrigin] = useState('BOG');
	const [destination, setDestination] = useState('MDE');

	const today = new Date().toISOString().split('T')[0];
	const [startDate, setStartDate] = useState(today);
	const [endDate, setEndDate] = useState(today);

	useEffect(() => {
		fetchHistory();
	}, []);

	async function fetchHistory() {
		try {
			setIsLoading(true);
			const res = await fetch('/api/tracking/history');
			if (res.ok) {
				const data = await res.json();
				setConfig(data.config);
				setHistory(data.history);
				if (data.config) {
					setOrigin(data.config.origin);
					setDestination(data.config.destination);
					setStartDate(data.config.startDate);
					setEndDate(data.config.endDate);
				}
			}
		} catch (error) {
			console.error("Failed to load tracking config", error);
		} finally {
			setIsLoading(false);
		}
	}

	const handleSubmit = async (e) => {
		e.preventDefault();

		const start = new Date(startDate);
		const end = new Date(endDate);
		const diffTime = Math.abs(end - start);
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		if (origin === destination) {
			alert('El origen y el destino no pueden ser iguales');
			return;
		}
		if (start > end) {
			alert('La fecha final debe ser posterior a la fecha inicial');
			return;
		}
		if (diffDays > 6) {
			alert('Para proteger la cuota de la API, el rango máximo para monitoreo en segundo plano es de 7 días.');
			return;
		}

		try {
			setIsLoading(true);
			const res = await fetch('/api/tracking/config', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ origin, destination, startDate, endDate })
			});
			if (res.ok) {
				alert('Configuración actualizada. El proceso en segundo plano se ejecutará cada hora.');
				fetchHistory(); // refresh
			} else {
				alert('Error al actualizar la configuración');
			}
		} catch (err) {
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	const formatCOP = (amount) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0
		}).format(amount);
	};

	const formatTime = (isoString) => {
		return new Date(isoString).toLocaleString('es-CO', {
			month: 'short', day: 'numeric',
			hour: 'numeric', minute: '2-digit', hour12: true
		});
	};

	return (
		<div className="tracking-view glass-card" style={{ padding: 'var(--space-2xl)', marginTop: '20px' }}>
			<div className="section-header">
				<h2 className="section-title">🕒 Monitor de precios por hora</h2>
				<p style={{ color: 'var(--text-secondary)' }}>Configura una ruta para buscar automáticamente cada hora caídas de precio en segundo plano.</p>
			</div>

			{/* Config Form */}
			<form onSubmit={handleSubmit} style={{ marginBottom: 'var(--space-2xl)' }}>
				<div className="search-form-grid" style={{ gridTemplateColumns: '1fr 1fr 1fr 1fr auto' }}>
					{/* Origin */}
					<div>
						<label className="search-label">Origen</label>
						<div className="select-wrapper">
							<select value={origin} onChange={(e) => setOrigin(e.target.value)} className="search-input">
								{cities.map(c => <option key={`orig-${c.code}`} value={c.code}>{c.city} ({c.code})</option>)}
							</select>
						</div>
					</div>

					{/* Destination */}
					<div>
						<label className="search-label">Destino</label>
						<div className="select-wrapper">
							<select value={destination} onChange={(e) => setDestination(e.target.value)} className="search-input">
								{cities.map(c => <option key={`dest-${c.code}`} value={c.code}>{c.city} ({c.code})</option>)}
							</select>
						</div>
					</div>

					{/* Start Date */}
					<div>
						<label className="search-label">Fecha inicial</label>
						<input
							type="date"
							value={startDate}
							onChange={(e) => setStartDate(e.target.value)}
							min={today}
							className="search-input"
							required
						/>
					</div>

					{/* End Date (Max 7 days) */}
					<div>
						<label className="search-label">Fecha final (máx. 7 días)</label>
						<input
							type="date"
							value={endDate}
							onChange={(e) => setEndDate(e.target.value)}
							min={startDate}
							className="search-input"
							required
						/>
					</div>

					{/* Save */}
					<div style={{ display: 'flex', alignItems: 'flex-end' }}>
						<button type="submit" className="search-btn" disabled={isLoading}>
							{isLoading ? 'Guardando...' : 'Guardar y monitorear'}
						</button>
					</div>
				</div>
			</form>

			{/* History Display */}
			{config && (
				<div className="tracking-history">
					<h3 style={{ marginBottom: '1rem', color: 'var(--text-primary)' }}>
						Precios esperados más bajos para {config.origin} → {config.destination}
					</h3>

					{Object.keys(history).length === 0 ? (
						<p style={{ color: 'var(--text-muted)' }}>Esperando que el monitor obtenga datos...</p>
					) : (
						<div style={{ display: 'grid', gap: '1rem' }}>
							{Object.keys(history).sort().map(flightDate => {
								const checks = history[flightDate];
								// Find the absolute cheapest record overall for this date
								const best = checks.reduce((prev, curr) => (curr.cheapestPrice < prev.cheapestPrice ? curr : prev), checks[0]);
								// Last checked 
								const latest = checks[checks.length - 1];

								return (
									<div key={flightDate} style={{ background: 'var(--bg-card)', padding: '1rem', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
										<div>
											<strong style={{ display: 'block', fontSize: '1.2rem', marginBottom: '4px' }}>Fecha: {flightDate}</strong>
											<span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mejor opción: {best?.airline} a las {best?.departureTime}</span>
										</div>
										<div style={{ textAlign: 'right' }}>
											<div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--system-success)' }}>
												{formatCOP(latest.cheapestPrice)}
											</div>
											<div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
												Última revisión: {formatTime(latest.recordedAt)}
											</div>
										</div>
									</div>
								);
							})}
						</div>
					)}
				</div>
			)}
		</div>
	);
}
