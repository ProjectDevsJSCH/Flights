import { useState } from 'react';

export default function BookingSearchForm({ cities, onSearch, isLoading }) {
	const [origin, setOrigin] = useState('BOG');
	const [destination, setDestination] = useState('MDE');

	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	const [date, setDate] = useState(tomorrow.toISOString().split('T')[0]);

	const [maxOption, setMaxOption] = useState('50');

	const handleSwap = () => {
		setOrigin(destination);
		setDestination(origin);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (origin === destination) {
			alert('Origin and destination cannot be the same');
			return;
		}
		onSearch({ origin, destination, date, max: maxOption });
	};

	return (
		<div className="search-section">
			<form className="glass-card" style={{ padding: 'var(--space-xl)' }} onSubmit={handleSubmit}>
				<div className="search-form-grid">

					{/* Origin */}
					<div>
						<label className="search-label">Origin</label>
						<div className="select-wrapper">
							<select
								value={origin}
								onChange={(e) => setOrigin(e.target.value)}
								className="search-input"
							>
								{cities.map(city => (
									<option key={`orig-${city.code}`} value={city.code}>
										{city.city} ({city.code})
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Swap */}
					<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
						<button
							type="button"
							className="swap-btn"
							onClick={handleSwap}
							title="Swap origin and destination"
							aria-label="Swap origin and destination"
						>
							⇄
						</button>
					</div>

					{/* Destination */}
					<div>
						<label className="search-label">Destination</label>
						<div className="select-wrapper">
							<select
								value={destination}
								onChange={(e) => setDestination(e.target.value)}
								className="search-input"
							>
								{cities.map(city => (
									<option key={`dest-${city.code}`} value={city.code}>
										{city.city} ({city.code})
									</option>
								))}
							</select>
						</div>
					</div>

					{/* Date */}
					<div>
						<label className="search-label">Departure Date</label>
						<input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							min={new Date().toISOString().split('T')[0]}
							className="search-input"
							style={{ colorScheme: 'dark', cursor: 'pointer' }}
							required
						/>
					</div>

					{/* Max Results */}
					<div>
						<label className="search-label">Max Results</label>
						<div className="select-wrapper">
							<select
								value={maxOption}
								onChange={(e) => setMaxOption(e.target.value)}
								className="search-input"
							>
								<option value="15">15 options</option>
								<option value="50">50 options</option>
								<option value="100">100 options</option>
								<option value="250">250 options</option>
							</select>
						</div>
					</div>

					{/* Submit */}
					<div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
						<button
							type="submit"
							className={`search-btn ${isLoading ? 'loading' : ''}`}
							disabled={isLoading}
						>
							<span className="search-btn-icon">{isLoading ? '⟳' : '✈'}</span>
							{isLoading ? 'Searching...' : 'Search Flights'}
						</button>
					</div>

				</div>
			</form>
		</div>
	);
}
