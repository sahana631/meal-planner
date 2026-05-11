import { useState, useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Recipes from './pages/Recipes';
import Pantry from './pages/Pantry';
import Cart from './pages/Cart';
import Login from './pages/Login';
import Profile from './pages/Profile';
import Planner from './pages/Planner';
import * as api from './services/api';
import './App.css';

export default function App() {
  const [user, setUser] = useState(null);
  const [recipes, setRecipes] = useState([]);
  const [cart, setCart] = useState([]);
  const [pantry, setPantry] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getMe()
      .then((user) => {
        setUser(user);
        return Promise.all([api.fetchRecipes(), api.fetchCart()]);
      })
      .then(([recipes, cart]) => {
        setRecipes(recipes);
        setCart(cart);
        return api.fetchPantry();
      })
      .then(setPantry)
      .catch(() => {}) // not logged in — show login page
      .finally(() => setLoading(false));
  }, []);

  async function handleAuth(user) {
    setUser(user);
    const [recipes, cart, pantry] = await Promise.all([api.fetchRecipes(), api.fetchCart(), api.fetchPantry()]);
    setRecipes(recipes);
    setCart(cart);
    setPantry(pantry);
  }

  async function handleLogout() {
    await api.logout();
    setUser(null);
    setRecipes([]);
    setCart([]);
    setPantry([]);
  }

  async function addRecipe(recipe) {
    const created = await api.createRecipe(recipe);
    setRecipes((prev) => [...prev, created]);
  }

  async function editRecipe(updated) {
    const saved = await api.updateRecipe(updated.id, updated);
    setRecipes((prev) => prev.map((r) => r.id === saved.id ? saved : r));
  }

  async function addDirectToCart(title, ingredients) {
    const item = await api.addCartItems({ recipeId: 0, recipeTitle: title, ingredients });
    setCart((prev) => [...prev, item]);
  }

  async function addToPantry(name) {
    const item = await api.addPantryItem(name);
    setPantry((prev) => [...prev.filter((p) => p.id !== item.id), item]);
  }

  async function removeFromPantry(id) {
    await api.removePantryItem(id);
    setPantry((prev) => prev.filter((p) => p.id !== id));
  }

  async function deleteRecipe(id) {
    await api.deleteRecipe(id);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }

  async function addToCart(recipe, selectedIngredients) {
    const existing = cart.find((item) => item.recipeId === recipe.id);
    if (existing) {
      const merged = [...new Set([...existing.ingredients, ...selectedIngredients])];
      const updated = await api.updateCartItem(existing.id, merged);
      setCart((prev) => prev.map((item) => item.id === updated.id ? updated : item));
    } else {
      const item = await api.addCartItems({ recipeId: recipe.id, recipeTitle: recipe.title, ingredients: selectedIngredients });
      setCart((prev) => [...prev, item]);
    }
  }

  async function removeIngredient(cartItemId, ingredient) {
    const item = cart.find((i) => i.id === cartItemId);
    if (!item) return;
    const updated = item.ingredients.filter((ing) => ing !== ingredient);
    const result = await api.updateCartItem(cartItemId, updated);
    if (result.deleted) {
      setCart((prev) => prev.filter((i) => i.id !== cartItemId));
    } else {
      setCart((prev) => prev.map((i) => i.id === cartItemId ? result : i));
    }
  }

  async function handleCheckout() {
    await api.clearCart();
    setCart([]);
  }


  const totalCount = cart.reduce((sum, item) => sum + item.ingredients.length, 0);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'var(--font-body)', color: 'var(--text-muted)' }}>
        Loading...
      </div>
    );
  }

  if (!user) {
    return <Login onAuth={handleAuth} />;
  }

  return (
    <>
      <Navbar cartCount={totalCount} user={user} onLogout={handleLogout} />
      <Routes>
        <Route
          path="/"
          element={<Home user={user} recipes={recipes} cart={cart} pantry={pantry} />}
        />
        <Route
          path="/recipes"
          element={
            <Recipes
              recipes={recipes}
              pantry={pantry}
              onAddToCart={addToCart}
              onAddToPantry={addToPantry}
              onAddRecipe={addRecipe}
              onEditRecipe={editRecipe}
              onDeleteRecipe={deleteRecipe}
            />
          }
        />
        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
              user={user}
              pantry={pantry}
              onRemoveIngredient={removeIngredient}
              onCheckout={handleCheckout}
            />
          }
        />
        <Route
          path="/planner"
          element={
            <Planner
              recipes={recipes}
              pantry={pantry}
              onAddToCart={addToCart}
              onAddDirectToCart={addDirectToCart}
              onAddToPantry={addToPantry}
            />
          }
        />
        <Route
          path="/pantry"
          element={<Pantry pantry={pantry} onAdd={addToPantry} onRemove={removeFromPantry} />}
        />
        <Route
          path="/profile"
          element={<Profile user={user} onUpdate={setUser} />}
        />
      </Routes>
    </>
  );
}
