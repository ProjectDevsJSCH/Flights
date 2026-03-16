import { useState } from 'react';

function formatCOP(amount) {
	return new Intl.NumberFormat('es-CO', {
		style: 'currency',
		currency: 'COP',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}


function SkeletonCard({ delay = 0 }) {
	return (
		<div
			className="skeleton-card"
			style={{ animationDelay: `${delay}ms` }}
		/>
	);
}

export default function BookingResults({ results, isLoading, hasSearched }) {
	const [timeFilter, setTimeFilter] = useState('all');

	if (isLoading) {
		return (
			<div className="flight-board">
				<div className="skeleton-list">
					<SkeletonCard delay={0} />
					<SkeletonCard delay={80} />
					<SkeletonCard delay={160} />
					<SkeletonCard delay={240} />
				</div>
			</div>
		);
	}

	if (!hasSearched) return null;

	const filteredResults = results.filter(flight => {
		if (timeFilter === 'all') return true;

		const hour = parseInt(flight.departureTime.split(':')[0], 10);
		if (timeFilter === 'madrugada') return hour < 6;
		if (timeFilter === 'noche') return hour >= 20;
		if (timeFilter === 'otro') return hour >= 6 && hour < 20;
		return true;
	});

	if (results.length === 0) {
		return (
			<div className="empty-state">
				<div className="empty-state-icon">🔍</div>
				<div className="empty-state-title">No se encontraron vuelos</div>
				<div className="empty-state-text">
					No hay disponibilidad para esta ruta en la fecha seleccionada.<br />
					Prueba otra fecha o ruta.
				</div>
			</div>
		);
	}

	return (
		<div className="flight-board">
			<div className="section-header">
				<div className="section-header-title-group">
					<h2 className="section-title">Vuelos disponibles</h2>
					<span className="section-badge">{filteredResults.length} opciones</span>
				</div>

				{/* Time Filters */}
				<div className="time-filters">
					<button
						className={`time-chip ${timeFilter === 'all' ? 'active' : ''}`}
						onClick={() => setTimeFilter('all')}
					>
						Todos
					</button>
					<button
						className={`time-chip ${timeFilter === 'madrugada' ? 'active' : ''}`}
						onClick={() => setTimeFilter('madrugada')}
					>
						Madrugada
					</button>
					<button
						className={`time-chip ${timeFilter === 'otro' ? 'active' : ''}`}
						onClick={() => setTimeFilter('otro')}
					>
						Día
					</button>
					<button
						className={`time-chip ${timeFilter === 'noche' ? 'active' : ''}`}
						onClick={() => setTimeFilter('noche')}
					>
						Noche
					</button>
				</div>
			</div>

			{filteredResults.length === 0 ? (
				<div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
					<div className="empty-state-text">No hay vuelos para el filtro de horario seleccionado.</div>
				</div>
			) : (
				<div className="flight-list">
					{filteredResults.map((flight, index) => {
						const fewSeats = flight.availableSeats < 5;
						return (
							<div
								key={flight.id}
								className="flight-card glass-card"
								style={{
									animationDelay: `${index * 45}ms`,
									'--airline-color': flight.airlineColor || 'var(--accent-indigo)',
								}}
							>
								{/* Airline */}
								<div className="flight-airline-info">
									<div
										className="flight-airline-dot"
										style={{ background: flight.airlineColor || 'var(--accent-indigo)' }}
									/>
									<div>
										<div className="flight-number">{flight.flightNumber}</div>
										<div className="flight-airline-name">{flight.airlineName}</div>
									</div>
								</div>

								{/* Route & Times */}
								<div className="flight-route-container" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 2 }}>
									{/* Outbound */}
									<div className="flight-route">
										<div className="flight-times origin">
											<div className="flight-time">{flight.departureTime}</div>
											<div className="flight-city-code">{flight.origin.code}</div>
										</div>

										<div className="flight-route-line">
											<span className="flight-route-plane" style={{ transform: 'rotate(0deg)' }}>✈</span>
											<div className="flight-duration">{flight.duration}</div>
										</div>

										<div className="flight-times destination">
											<div className="flight-time">{flight.arrivalTime}</div>
											<div className="flight-city-code">{flight.destination.code}</div>
										</div>
									</div>

									{/* Inbound (If round trip) */}
									{flight.returnFlight && (
										<div className="flight-route" style={{ borderTop: '1px dashed var(--border-color)', paddingTop: '1rem' }}>
											<div className="flight-times origin">
												<div className="flight-time">{flight.returnFlight.departureTime}</div>
												<div className="flight-city-code">{flight.returnFlight.origin.code}</div>
											</div>

											<div className="flight-route-line">
												<span className="flight-route-plane" style={{ transform: 'rotate(180deg)' }}>✈</span>
												<div className="flight-duration">{flight.returnFlight.duration}</div>
											</div>

											<div className="flight-times destination">
												<div className="flight-time">{flight.returnFlight.arrivalTime}</div>
												<div className="flight-city-code">{flight.returnFlight.destination.code}</div>
											</div>
										</div>
									)}
								</div>

								{/* Fare */}
								<div className="flight-fare">
									<div className="flight-fare-type">{flight.fareType}</div>
									<div className={`flight-baggage ${flight.baggageIncluded ? 'included' : ''}`}>
										{flight.baggageIncluded ? '🎒 Incluido' : '👛 Mano'}
									</div>
								</div>

								{/* Price */}
								<div className="flight-price-col">
									<div>
										<div className="flight-price">{formatCOP(flight.priceCOP)}</div>
										<div className={`flight-seats ${fewSeats ? 'few' : 'ok'}`}>
											{fewSeats ? `⚡ Quedan ${flight.availableSeats}` : `${flight.availableSeats} asientos`}
										</div>
									</div>
								</div>

								{/* Action
								<div className="flight-action">
									<button
										className="book-btn"
										onClick={() => alert(`Aquí iniciaría el flujo de reserva para ${flight.flightNumber}.`)}
									>
										Reservar →
									</button>
								</div> */}
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
