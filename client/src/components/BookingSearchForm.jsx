import { useState } from 'react';

export default function BookingSearchForm({ cities, onSearch, isLoading }) {
	const [origin, setOrigin] = useState('BOG');
	const [destination, setDestination] = useState('MDE');

	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	const nextWeek = new Date(tomorrow);
	nextWeek.setDate(nextWeek.getDate() + 7);

	const [date, setDate] = useState(tomorrow.toISOString().split('T')[0]);
	const [returnDate, setReturnDate] = useState(nextWeek.toISOString().split('T')[0]);
	const [isRoundTrip, setIsRoundTrip] = useState(false);

	const [maxOption, setMaxOption] = useState('50');

	const handleSwap = () => {
		setOrigin(destination);
		setDestination(origin);
	};

	const handleSubmit = (e) => {
		e.preventDefault();
		if (origin === destination) {
			alert('El origen y el destino no pueden ser iguales');
			return;
		}
		if (isRoundTrip && new Date(returnDate) < new Date(date)) {
			alert('La fecha de regreso no puede ser anterior a la fecha de salida');
			return;
		}

		const searchParams = { origin, destination, date, max: maxOption };
		if (isRoundTrip) {
			searchParams.returnDate = returnDate;
		}

		onSearch(searchParams);
	};

	return (
		<div className="search-section">
			<form className="glass-card" onSubmit={handleSubmit}>
				{/* Trip Type Selector */}
				<div style={{ marginBottom: '1rem', display: 'flex', gap: '1rem' }}>
					<label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: isRoundTrip ? 'normal' : '600' }}>
						<input
							type="radio"
							name="tripType"
							checked={!isRoundTrip}
							onChange={() => setIsRoundTrip(false)}
							style={{ accentColor: 'var(--accent-primary)' }}
						/>
						Solo ida
					</label>
					<label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-primary)', fontWeight: isRoundTrip ? '600' : 'normal' }}>
						<input
							type="radio"
							name="tripType"
							checked={isRoundTrip}
							onChange={() => setIsRoundTrip(true)}
							style={{ accentColor: 'var(--accent-primary)' }}
						/>
						Ida y vuelta
					</label>
				</div>

				<div className="search-form-grid" style={{ gridTemplateColumns: isRoundTrip ? '1fr auto 1fr 1fr 1fr 1fr auto' : '1fr auto 1fr 1fr 1fr auto' }}>
					{/* Origin */}
					<div className="search-field">
						<label className="search-label">Origen</label>
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
					<div className="swap-btn-container">
						<button
							type="button"
							className="swap-btn"
							onClick={handleSwap}
							title="Intercambiar"
							aria-label="Intercambiar"
						>
							⇄
						</button>
					</div>

					{/* Destination */}
					<div className="search-field">
						<label className="search-label">Destino</label>
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
					<div className="search-field">
						<label className="search-label">Salida</label>
						<input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							min={new Date().toISOString().split('T')[0]}
							className="search-input"
							required
						/>
					</div>

					{/* Return Date */}
					{isRoundTrip && (
						<div className="search-field">
							<label className="search-label">Regreso</label>
							<input
								type="date"
								value={returnDate}
								onChange={(e) => setReturnDate(e.target.value)}
								min={date}
								className="search-input"
								required={isRoundTrip}
							/>
						</div>
					)}

					{/* Max Results */}
					<div className="search-field">
						<label className="search-label">Máximo</label>
						<div className="select-wrapper">
							<select
								value={maxOption}
								onChange={(e) => setMaxOption(e.target.value)}
								className="search-input"
							>
								<option value="15">15 opciones</option>
								<option value="50">50 opciones</option>
								<option value="100">100 opciones</option>
							</select>
						</div>
					</div>

					{/* Submit */}
					<div className="search-submit-container" style={{ display: 'flex', alignItems: 'flex-end' }}>
						<button
							type="submit"
							className={`search-btn ${isLoading ? 'loading' : ''}`}
							disabled={isLoading}
						>
							<span className="search-btn-icon">{isLoading ? '⟳' : '✈'}</span>
							{isLoading ? 'Buscando...' : 'Buscar'}
						</button>
					</div>

				</div>
			</form>
		</div>
	);
}
