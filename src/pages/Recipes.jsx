import { useState } from 'react';
import { Plus, Search } from 'lucide-react';
import RecipeCard from '../components/RecipeCard';
import RecipeModal from '../components/RecipeModal';
import AddRecipeModal from '../components/AddRecipeModal';
import './Recipes.css';

export default function Recipes({ recipes, pantry, onAddToCart, onAddToPantry, onAddRecipe, onEditRecipe, onDeleteRecipe }) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [search, setSearch] = useState('');
  const [activeTag, setActiveTag] = useState(null);

  const allTags = [...new Set(recipes.flatMap((r) => r.tags || []))].sort();

  const filtered = recipes.filter((r) => {
    const matchesSearch = r.title.toLowerCase().includes(search.toLowerCase());
    const matchesTag = !activeTag || (r.tags || []).includes(activeTag);
    return matchesSearch && matchesTag;
  });

  return (
    <main className="recipes-page">
      <div className="recipes-header">
        <h1>Recipes</h1>
        <button className="add-recipe-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Recipe
        </button>
      </div>

      <div className="recipes-filter-bar">
        <div className="recipes-search-wrap">
          <Search size={15} className="recipes-search-icon" />
          <input
            className="recipes-search"
            placeholder="Search recipes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {allTags.length > 0 && (
          <div className="recipes-tag-row">
            {allTags.map((tag) => (
              <button
                key={tag}
                className={`filter-tag ${activeTag === tag ? 'filter-tag--active' : ''}`}
                onClick={() => setActiveTag((t) => t === tag ? null : tag)}
              >
                {tag}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="recipes-empty">No recipes match your search.</p>
      ) : (
        <div className="recipes-grid">
          {filtered.map((recipe) => (
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
      )}

      <RecipeModal
        recipe={selectedRecipe}
        pantry={pantry}
        onClose={() => setSelectedRecipe(null)}
        onAddToCart={onAddToCart}
        onAddToPantry={onAddToPantry}
      />

      {showAddModal && (
        <AddRecipeModal onClose={() => setShowAddModal(false)} onSave={onAddRecipe} />
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
