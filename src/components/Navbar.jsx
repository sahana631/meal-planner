import { useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import './Navbar.css';

function getInitials(name) {
  return name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Navbar({ cartCount, user, onLogout }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="navbar">
      <NavLink to="/" className="navbar-brand">Cartable</NavLink>
      <div className="navbar-links">
        <NavLink to="/recipes" className={({ isActive }) => isActive ? 'active' : ''}>Recipes</NavLink>
        <NavLink to="/planner" className={({ isActive }) => isActive ? 'active' : ''}>Planner</NavLink>
        <NavLink to="/pantry" className={({ isActive }) => isActive ? 'active' : ''}>Pantry</NavLink>
        <NavLink to="/cart" className={({ isActive }) => isActive ? 'active' : ''}>
          My Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
        </NavLink>
        {user && (
          <div className="navbar-user" ref={dropdownRef}>
            <button
              className="navbar-avatar"
              title={user.name}
              onClick={() => setOpen((prev) => !prev)}
            >
              {getInitials(user.name)}
            </button>
            {open && (
              <div className="navbar-dropdown">
                <NavLink
                  to="/profile"
                  className="navbar-dropdown-item"
                  onClick={() => setOpen(false)}
                >
                  View Profile
                </NavLink>
                <button
                  className="navbar-dropdown-item navbar-dropdown-logout"
                  onClick={() => { setOpen(false); onLogout(); }}
                >
                  Log out
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </nav>
  );
}
