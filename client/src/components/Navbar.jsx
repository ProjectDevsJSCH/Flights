import { useClock } from '../hooks/useClock';

export default function Navbar() {
	const { formatted, date } = useClock();

	return (
		<nav className="navbar" role="navigation" aria-label="Navegación principal">
			<div className="navbar-inner">
				<div className="navbar-brand">
					<span className="navbar-logo">🛫</span>
					<div>
						<div className="navbar-title">SkyTracker</div>
						<div className="navbar-subtitle">Reservas y Precios de Vuelos</div>
					</div>
				</div>

				<div style={{ textAlign: 'right' }}>
					<div className="navbar-clock">{formatted}</div>
					<div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '3px' }}>{date}</div>
				</div>
			</div>
		</nav>
	);
}
