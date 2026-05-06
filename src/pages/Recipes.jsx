import { useState } from 'react';
import RecipeCard from '../components/RecipeCard';
import RecipeModal from '../components/RecipeModal';
import './Recipes.css';

const SAMPLE_RECIPES = [
  {
    id: 1,
    title: 'Chicken & Rice Bowl',
    description: 'Grilled chicken thighs over jasmine rice with roasted veggies and a garlic soy glaze.',
    time: '35 min',
    servings: 4,
    ingredients: [
      '4 chicken thighs',
      '2 cups jasmine rice',
      '1 cup broccoli florets',
      '1 red bell pepper, sliced',
      '3 cloves garlic, minced',
      '3 tbsp soy sauce',
      '1 tbsp sesame oil',
      '1 tbsp olive oil',
      'Salt and pepper to taste',
    ],
  },
  {
    id: 2,
    title: 'Turkey Taco Meal Prep',
    description: 'Seasoned ground turkey with black beans, corn, and salsa — great for wraps or bowls all week.',
    time: '25 min',
    servings: 5,
    ingredients: [
      '1.5 lbs ground turkey',
      '1 can black beans, drained',
      '1 cup frozen corn',
      '1 cup salsa',
      '1 packet taco seasoning',
      '1 tbsp olive oil',
      'Salt and pepper to taste',
    ],
  },
  {
    id: 3,
    title: 'Salmon & Roasted Broccoli',
    description: 'Lemon-herb salmon fillets with crispy broccoli and brown rice. High protein, low effort.',
    time: '30 min',
    servings: 3,
    ingredients: [
      '3 salmon fillets',
      '3 cups broccoli florets',
      '1.5 cups brown rice',
      '2 tbsp olive oil',
      '1 lemon, sliced',
      '2 cloves garlic, minced',
      '1 tsp dried dill',
      'Salt and pepper to taste',
    ],
  },
  {
    id: 4,
    title: 'Pasta Primavera',
    description: 'Penne with seasonal vegetables in a light olive oil and garlic sauce. Easy weeknight dinner.',
    time: '20 min',
    servings: 4,
    ingredients: [
      '12 oz penne pasta',
      '1 zucchini, sliced',
      '1 cup cherry tomatoes',
      '1 yellow bell pepper, chopped',
      '4 cloves garlic, minced',
      '3 tbsp olive oil',
      '1/4 cup parmesan cheese',
      'Fresh basil to taste',
      'Salt and pepper to taste',
    ],
  },
  {
    id: 5,
    title: 'Greek Chicken Bowls',
    description: 'Marinated chicken with cucumber, tomato, feta, olives, and tzatziki over quinoa.',
    time: '40 min',
    servings: 4,
    ingredients: [
      '4 chicken breasts',
      '1.5 cups quinoa',
      '1 cucumber, diced',
      '1 cup cherry tomatoes, halved',
      '1/2 cup kalamata olives',
      '1/2 cup feta cheese, crumbled',
      '1/2 cup tzatziki sauce',
      '2 tbsp olive oil',
      '1 tsp dried oregano',
      'Salt and pepper to taste',
    ],
  },
  {
    id: 6,
    title: 'Beef & Vegetable Stir Fry',
    description: 'Tender beef strips with bell peppers, snap peas, and carrots in a savory stir fry sauce.',
    time: '20 min',
    servings: 3,
    ingredients: [
      '1 lb beef sirloin, thinly sliced',
      '1 cup snap peas',
      '1 red bell pepper, sliced',
      '2 carrots, julienned',
      '3 cloves garlic, minced',
      '2 tbsp soy sauce',
      '1 tbsp oyster sauce',
      '1 tsp cornstarch',
      '1 tbsp sesame oil',
      '2 cups cooked rice',
    ],
  },
];

export default function Recipes({ onAddToCart }) {
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  return (
    <main className="recipes-page">
      <h1>Recipes</h1>
      <div className="recipes-grid">
        {SAMPLE_RECIPES.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            {...recipe}
            onViewRecipe={() => setSelectedRecipe(recipe)}
            onAddToCart={() => setSelectedRecipe(recipe)}
          />
        ))}
      </div>
      <RecipeModal
        recipe={selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        onAddToCart={onAddToCart}
      />
    </main>
  );
}
