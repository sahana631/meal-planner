import { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Recipes from './pages/Recipes';
import Cart from './pages/Cart';
import './App.css';

export default function App() {
  const [cart, setCart] = useState([]);

  function addToCart(recipe, selectedIngredients) {
    setCart((prev) => {
      const existing = prev.find((item) => item.recipeId === recipe.id);
      if (existing) {
        return prev.map((item) =>
          item.recipeId === recipe.id
            ? { ...item, ingredients: [...new Set([...item.ingredients, ...selectedIngredients])] }
            : item
        );
      }
      return [...prev, { recipeId: recipe.id, recipeTitle: recipe.title, ingredients: selectedIngredients }];
    });
  }

  function removeIngredient(recipeId, ingredient) {
    setCart((prev) =>
      prev
        .map((item) =>
          item.recipeId === recipeId
            ? { ...item, ingredients: item.ingredients.filter((i) => i !== ingredient) }
            : item
        )
        .filter((item) => item.ingredients.length > 0)
    );
  }

  const totalCount = cart.reduce((sum, item) => sum + item.ingredients.length, 0);

  return (
    <>
      <Navbar cartCount={totalCount} />
      <Routes>
        <Route path="/" element={<Recipes onAddToCart={addToCart} />} />
        <Route path="/cart" element={<Cart cart={cart} onRemoveIngredient={removeIngredient} />} />
      </Routes>
    </>
  );
}
