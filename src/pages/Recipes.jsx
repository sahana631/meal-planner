import { useState } from 'react';
import { Plus } from 'lucide-react';
import RecipeCard from '../components/RecipeCard';
import RecipeModal from '../components/RecipeModal';
import AddRecipeModal from '../components/AddRecipeModal';
import './Recipes.css';

export default function Recipes({ recipes, onAddToCart, checkedByRecipe, setCheckedByRecipe, onAddRecipe, onEditRecipe, onDeleteRecipe }) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);

  function getChecked(recipe) {
    return checkedByRecipe[recipe.id] ?? {};
  }

  function handleToggle(recipeId, index) {
    setCheckedByRecipe((prev) => ({
      ...prev,
      [recipeId]: { ...prev[recipeId], [index]: !prev[recipeId]?.[index] },
    }));
  }

  function handleToggleAll(recipe, checked) {
    const updated = {};
    recipe.ingredients.forEach((_, i) => { updated[i] = checked; });
    setCheckedByRecipe((prev) => ({ ...prev, [recipe.id]: updated }));
  }

  function handleAddToCart(recipe, selectedIngredients) {
    onAddToCart(recipe, selectedIngredients);
    setSelectedRecipe(null);
  }

  return (
    <main className="recipes-page">
      <div className="recipes-header">
        <h1>Recipes</h1>
        <button className="add-recipe-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={16} />
          Add Recipe
        </button>
      </div>
      <div className="recipes-grid">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            {...recipe}
            onViewRecipe={() => setSelectedRecipe(recipe)}
            onAddToCart={() => setSelectedRecipe(recipe)}
            onEdit={() => setEditingRecipe(recipe)}
            onDelete={() => onDeleteRecipe(recipe.id)}
          />
        ))}
      </div>
      <RecipeModal
        recipe={selectedRecipe}
        checked={selectedRecipe ? getChecked(selectedRecipe) : {}}
        onToggle={(index) => handleToggle(selectedRecipe.id, index)}
        onToggleAll={(checked) => handleToggleAll(selectedRecipe, checked)}
        onClose={() => setSelectedRecipe(null)}
        onAddToCart={handleAddToCart}
      />
      {showAddModal && (
        <AddRecipeModal
          onClose={() => setShowAddModal(false)}
          onSave={onAddRecipe}
        />
      )}
      {editingRecipe && (
        <AddRecipeModal
          initialRecipe={editingRecipe}
          onClose={() => setEditingRecipe(null)}
          onSave={(updated) => { onEditRecipe(updated); setEditingRecipe(null); }}
        />
      )}
    </main>
  );
}
