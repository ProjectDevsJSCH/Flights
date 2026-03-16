import { useState, useEffect, useRef } from 'react';

export default function TrackingView({ cities = [] }) {
	const [trackers, setTrackers] = useState([]);
	const [isLoading, setIsLoading] = useState(true);
	const [editingConfigId, setEditingConfigId] = useState(null);
	const pollingRef = useRef(null);

	// Form specific state
	const [origin, setOrigin] = useState('BOG');
	const [destination, setDestination] = useState('MDE');

	const today = new Date().toISOString().split('T')[0];
	const [startDate, setStartDate] = useState(today);
	const [endDate, setEndDate] = useState(today);

	useEffect(() => {
		fetchHistory();
		return () => stopPolling();
	}, []);

	function startPolling() {
		stopPolling();
		pollingRef.current = setInterval(() => {
			fetchHistory(true);
		}, 5000);
	}

	function stopPolling() {
		if (pollingRef.current) {
			clearInterval(pollingRef.current);
			pollingRef.current = null;
		}
	}

	async function fetchHistory(silent = false) {
		try {
			if (!silent) setIsLoading(true);
			const res = await fetch('/api/tracking/history');
			if (res.ok) {
				const data = await res.json();
				setTrackers(data.results || []);
				
				const hasAnyHistory = data.results && data.results.some(t => Object.keys(t.history).length > 0);
				if (hasAnyHistory) {
					stopPolling();
				}
			}
		} catch (error) {
			console.error("Failed to load tracking configs", error);
		} finally {
			if (!silent) setIsLoading(false);
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
			const url = editingConfigId ? `/api/tracking/config/${editingConfigId}` : '/api/tracking/config';
			const method = editingConfigId ? 'PUT' : 'POST';
			const res = await fetch(url, {
				method,
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ origin, destination, startDate, endDate })
			});
			
			if (res.ok) {
				alert(editingConfigId ? 'Configuración actualizada.' : 'Monitor activado.');
				setEditingConfigId(null);
				fetchHistory(); // refresh
				startPolling(); // poll until data arrives
			} else {
				alert('Error al actualizar la configuración');
			}
		} catch (err) {
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleStopTracking = async (id) => {
		if (!confirm('¿Eliminar el monitoreo de esta ruta?')) return;
		try {
			setIsLoading(true);
			const res = await fetch(`/api/tracking/config/${id}`, { method: 'DELETE' });
			if (res.ok) {
				fetchHistory();
			} else {
				alert('Error al detener el monitoreo');
			}
		} catch (err) {
			console.error(err);
		} finally {
			setIsLoading(false);
		}
	};

	const handleEdit = (trackerItem) => {
		const conf = trackerItem.config;
		setOrigin(conf.origin);
		setDestination(conf.destination);
		setStartDate(conf.startDate);
		setEndDate(conf.endDate);
		setEditingConfigId(conf.id);
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	const cancelEdit = () => {
		setEditingConfigId(null);
	};

	const formatCOP = (amount) => {
		return new Intl.NumberFormat('es-CO', {
			style: 'currency',
			currency: 'COP',
			minimumFractionDigits: 0
		}).format(amount);
	};

	const formatDate = (dateStr) => {
		const [year, month, day] = dateStr.split('-').map(Number);
		const date = new Date(year, month - 1, day);
		return date.toLocaleDateString('es-CO', {
			day: 'numeric',
			month: 'long',
			year: 'numeric'
		});
	};

	const formatDateTime = (isoString) => {
		return new Date(isoString).toLocaleString('es-CO', {
			day: 'numeric',
			month: 'long',
			year: 'numeric',
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	};

	return (
		<div className="tracking-view glass-card" style={{ padding: 'var(--space-2xl)', marginTop: '20px' }}>
			<div className="section-header">
				<h2 className="section-title">🕒 Monitor de precios por hora</h2>
				<p style={{ color: 'var(--text-secondary)' }}>Configura rutas para buscar automáticamente cada hora caídas de precio en segundo plano.</p>
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
					<div style={{ display: 'flex', alignItems: 'flex-end', gap: '0.5rem' }}>
						<button type="submit" className="search-btn" disabled={isLoading}>
							{isLoading ? '...' : editingConfigId ? 'Actualizar' : 'Guardar y monitorear'}
						</button>
						{editingConfigId && (
							<button type="button" onClick={cancelEdit} className="search-btn" style={{ background: '#95a5a6' }}>
								Cancelar
							</button>
						)}
					</div>
				</div>
			</form>

			{/* History Display */}
			{trackers.length > 0 && (
				<div className="tracking-history-list" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
					{trackers.map((trackerItem) => {
						const config = trackerItem.config;
						const history = trackerItem.history;

						return (
							<div key={config.id} className="tracking-history" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '2rem' }}>
								<div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
									<div>
										<h3 style={{ margin: 0, color: 'var(--text-primary)' }}>
											{config.origin} → {config.destination}
										</h3>
										<div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
											Monitoreando desde: {formatDate(config.startDate)} al {formatDate(config.endDate)}
										</div>
									</div>
									<div style={{ display: 'flex', gap: '0.5rem' }}>
										<button
											onClick={() => handleEdit(trackerItem)}
											disabled={isLoading}
											style={{
												background: 'var(--system-warning, #f39c12)',
												color: '#fff',
												border: 'none',
												padding: '0.5rem 1rem',
												borderRadius: 'var(--radius-md, 8px)',
												cursor: 'pointer',
												fontSize: '0.85rem',
												fontWeight: '600'
											}}
										>
											✏️ Editar
										</button>
										<button
											onClick={() => handleStopTracking(config.id)}
											disabled={isLoading}
											style={{
												background: 'var(--system-danger, #e74c3c)',
												color: '#fff',
												border: 'none',
												padding: '0.5rem 1rem',
												borderRadius: 'var(--radius-md, 8px)',
												cursor: 'pointer',
												fontSize: '0.85rem',
												fontWeight: '600',
												whiteSpace: 'nowrap'
											}}
										>
											🛑 Eliminar
										</button>
									</div>
								</div>

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
													<div style={{ flex: 1 }}>
														<strong style={{ display: 'block', fontSize: '1.1rem', marginBottom: '4px', textTransform: 'capitalize' }}>
															📅 {formatDate(flightDate)}
														</strong>
														<span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Mejor opción: {best?.airline}</span>
													</div>
													<div style={{ textAlign: 'center', padding: '0 1.5rem' }}>
														<div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '2px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Salida</div>
														<div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>
															🕐 {best?.departureTime}
														</div>
													</div>
													<div style={{ textAlign: 'right' }}>
														<div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: 'var(--system-success)' }}>
															{formatCOP(latest.cheapestPrice)}
														</div>
														<div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'capitalize' }}>
															Última revisión: {formatDateTime(latest.recordedAt)}
														</div>
													</div>
												</div>
											);
										})}
									</div>
								)}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
