import { useState } from 'react';

function formatCOP(amount) {
	return new Intl.NumberFormat('es-CO', {
		style: 'currency',
		currency: 'COP',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function formatEUR(amount) {
	return new Intl.NumberFormat('en-US', {
		style: 'currency',
		currency: 'EUR',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0,
	}).format(amount);
}

function SkeletonCard({ delay = 0 }) {
	return (
		<div
			className="skeleton-card"
			style={{ animationDelay: `${delay}ms`, height: '78px' }}
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
				<div className="empty-state-title">No flights found</div>
				<div className="empty-state-text">
					No availability for this route on the selected date.<br />
					Try a different date or route.
				</div>
			</div>
		);
	}

	return (
		<div className="flight-board">
			<div className="section-header" style={{ flexWrap: 'wrap', gap: 'var(--space-md)' }}>
				<div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-md)' }}>
					<h2 className="section-title">
						Available Flights
					</h2>
					<span className="section-badge">{filteredResults.length} options</span>
				</div>

				{/* Time Filters */}
				<div className="time-filters">
					<button
						className={`time-chip ${timeFilter === 'all' ? 'active' : ''}`}
						onClick={() => setTimeFilter('all')}
					>
						All
					</button>
					<button
						className={`time-chip ${timeFilter === 'madrugada' ? 'active' : ''}`}
						onClick={() => setTimeFilter('madrugada')}
					>
						Madrugada (&lt;6 AM)
					</button>
					<button
						className={`time-chip ${timeFilter === 'otro' ? 'active' : ''}`}
						onClick={() => setTimeFilter('otro')}
					>
						Día (6 AM - 8 PM)
					</button>
					<button
						className={`time-chip ${timeFilter === 'noche' ? 'active' : ''}`}
						onClick={() => setTimeFilter('noche')}
					>
						Noche (&gt;8 PM)
					</button>
				</div>
			</div>

			{filteredResults.length === 0 ? (
				<div className="empty-state" style={{ padding: 'var(--space-xl)' }}>
					<div className="empty-state-text">No flights match the selected time filter.</div>
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
										style={{ background: flight.airlineColor || 'var(--accent-indigo)', color: flight.airlineColor || 'var(--accent-indigo)' }}
									/>
									<div>
										<div className="flight-number">{flight.flightNumber}</div>
										<div className="flight-airline-name">{flight.airlineName}</div>
									</div>
								</div>

								{/* Route & Times */}
								<div className="flight-route">
									<div className="flight-times" style={{ textAlign: 'left' }}>
										<div className="flight-time">{flight.departureTime}</div>
										<div className="flight-city-code">{flight.origin.code}</div>
									</div>

									<div className="flight-route-line" style={{ maxWidth: '110px', margin: '0 var(--space-md)' }}>
										<span className="flight-route-plane" style={{ top: '-10px' }}>✈</span>
										<div className="flight-duration">{flight.duration}</div>
									</div>

									<div className="flight-times" style={{ textAlign: 'right' }}>
										<div className="flight-time">{flight.arrivalTime}</div>
										<div className="flight-city-code">{flight.destination.code}</div>
									</div>
								</div>

								{/* Fare */}
								<div className="flight-fare">
									<div className="flight-fare-type">{flight.fareType}</div>
									<div className={`flight-baggage ${flight.baggageIncluded ? 'included' : ''}`}>
										{flight.baggageIncluded ? '🎒 Bag Included' : '👛 Carry-on Only'}
									</div>
								</div>

								{/* Price */}
								<div className="flight-price-col">
									<div className="flight-price">
										{formatCOP(flight.priceCOP)}
									</div>
									<div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px' }}>
										≈ {formatEUR(flight.priceEur)}
									</div>
									<div className={`flight-seats ${fewSeats ? 'few' : 'ok'}`}>
										{fewSeats ? `⚡ ${flight.availableSeats} left` : `${flight.availableSeats} seats`}
									</div>
								</div>

								{/* Action */}
								<div className="flight-action">
									<button
										className="book-btn"
										onClick={() => alert(`Booking flow for ${flight.flightNumber} would start here!`)}
									>
										Book →
									</button>
								</div>
							</div>
						);
					})}
				</div>
			)}
		</div>
	);
}
