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
			alert('El origen y el destino no pueden ser iguales');
			return;
		}
		onSearch({ origin, destination, date, max: maxOption });
	};

	return (
		<div className="search-section">
			<form className="glass-card" onSubmit={handleSubmit}>
				<div className="search-form-grid">

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
						<label className="search-label">Fecha de salida</label>
						<input
							type="date"
							value={date}
							onChange={(e) => setDate(e.target.value)}
							min={new Date().toISOString().split('T')[0]}
							className="search-input"
							required
						/>
					</div>

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
					<div className="search-submit-container">
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
