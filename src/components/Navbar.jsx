import { NavLink } from 'react-router-dom';
import './Navbar.css';

export default function Navbar({ cartCount }) {
  return (
    <nav className="navbar">
      <span className="navbar-brand">Cartify</span>
      <div className="navbar-links">
        <NavLink to="/" end className={({ isActive }) => isActive ? 'active' : ''}>Recipes</NavLink>
        <NavLink to="/cart" className={({ isActive }) => isActive ? 'active' : ''}>
          My Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </NavLink>
      </div>
    </nav>
  );
}
