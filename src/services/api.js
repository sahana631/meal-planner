const BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const err = new Error(data.error || `Request failed with status ${res.status}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

// Auth
export const getMe = () => request('/auth/me');
export const login = (data) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) });
export const register = (data) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) });
export const logout = () => request('/auth/logout', { method: 'POST' });

export const updateProfile = (data) => request('/auth/profile', { method: 'PUT', body: JSON.stringify(data) });

// Recipes
export const fetchRecipes = () => request('/api/recipes');
export const createRecipe = (data) => request('/api/recipes', { method: 'POST', body: JSON.stringify(data) });
export const updateRecipe = (id, data) => request(`/api/recipes/${id}`, { method: 'PUT', body: JSON.stringify(data) });

// Cart
export const fetchCart = () => request('/api/cart');
export const addCartItems = (data) => request('/api/cart/items', { method: 'POST', body: JSON.stringify(data) });
export const updateCartItem = (id, ingredients) => request(`/api/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ ingredients }) });
export const clearCart = () => request('/api/cart', { method: 'DELETE' });

// Planner
export const fetchPlanner = (start, end) => request(`/api/planner?start=${start}&end=${end}`);
export const addMealPlan = (data) => request('/api/planner', { method: 'POST', body: JSON.stringify(data) });
export const removeMealPlan = (id) => request(`/api/planner/${id}`, { method: 'DELETE' });

// Kroger
export const connectKroger = () => { window.location.href = `${BASE}/auth/kroger/connect`; };
export const loginWithKroger = () => { window.location.href = `${BASE}/auth/kroger/login`; };
export const searchKroger = (ingredients) => request('/auth/kroger/search', { method: 'POST', body: JSON.stringify({ ingredients }) });
export const sendToKroger = (items) => request('/auth/kroger/send-cart', { method: 'POST', body: JSON.stringify({ items }) });
