const BASE = import.meta.env.VITE_API_URL || '';

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
export const deleteRecipe = (id) => request(`/api/recipes/${id}`, { method: 'DELETE' });

// Cart
export const fetchCart = () => request('/api/cart');
export const addCartItems = (data) => request('/api/cart/items', { method: 'POST', body: JSON.stringify(data) });
export const updateCartItem = (id, ingredients) => request(`/api/cart/items/${id}`, { method: 'PATCH', body: JSON.stringify({ ingredients }) });
export const clearCart = () => request('/api/cart', { method: 'DELETE' });

// Planner
export const fetchPlanner = (start, end) => request(`/api/planner?start=${start}&end=${end}`);
export const addMealPlan = (data) => request('/api/planner', { method: 'POST', body: JSON.stringify(data) });
export const removeMealPlan = (id) => request(`/api/planner/${id}`, { method: 'DELETE' });

// Pantry
export const fetchPantry = () => request('/api/pantry');
export const addPantryItem = (name) => request('/api/pantry', { method: 'POST', body: JSON.stringify({ name }) });
export const removePantryItem = (id) => request(`/api/pantry/${id}`, { method: 'DELETE' });

// AI
export const parseRecipe = (text) => request('/api/parse-recipe', { method: 'POST', body: JSON.stringify({ text }) });
export const planMeals = (description, recipes, pantryItems = []) => request('/api/plan-meals', { method: 'POST', body: JSON.stringify({ description, recipes, pantryItems }) });

// Kroger
export const connectKroger = () => { window.location.href = `${BASE}/auth/kroger/connect`; };
export const loginWithKroger = () => { window.location.href = `${BASE}/auth/kroger/login`; };
export const searchKrogerLocations = ({ zip, lat, lng } = {}, chain = null) => {
  const params = new URLSearchParams();
  if (lat != null && lng != null) { params.set('lat', lat); params.set('lng', lng); }
  else if (zip) params.set('zip', zip);
  if (chain) params.set('chain', chain);
  return request(`/auth/kroger/locations?${params}`);
};
export const searchKroger = (ingredients, locationId = null) => request('/auth/kroger/search', { method: 'POST', body: JSON.stringify({ ingredients, locationId }) });
export const sendToKroger = (items) => request('/auth/kroger/send-cart', { method: 'POST', body: JSON.stringify({ items }) });
