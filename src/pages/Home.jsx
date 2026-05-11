import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UtensilsCrossed, CalendarDays, ShoppingCart, Refrigerator } from 'lucide-react';
import { fetchPlanner } from '../services/api';
import { isInPantry } from '../utils/pantryMatch';
import './Home.css';

const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];
const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function greeting(name) {
  const hour = new Date().getHours();
  const time = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening';
  return `Good ${time}, ${name.split(' ')[0]}!`;
}

const PANTRY_PREVIEW_LIMIT = 18;

export default function Home({ user, recipes, cart, pantry = [] }) {
  const [plans, setPlans] = useState([]);
  const navigate = useNavigate();

  const weekStart = getMonday(new Date());
  const weekDates = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekEnd = weekDates[6];

  useEffect(() => {
    fetchPlanner(formatDate(weekStart), formatDate(weekEnd))
      .then(setPlans)
      .catch(() => {});
  }, []);

  const cartItemCount = cart.reduce((sum, item) => sum + item.ingredients.length, 0);
  const recentRecipes = [...recipes].reverse().slice(0, 4);
  const todayStr = formatDate(new Date());

  const pantryNames = new Set((pantry || []).map((p) => p.name));
  const readyToMake = pantryNames.size > 0
    ? [...recipes]
        .map((r) => ({
          ...r,
          missing: r.ingredients.filter((ing) => !isInPantry(ing, pantryNames)).length,
        }))
        .filter((r) => r.missing < r.ingredients.length)
        .sort((a, b) => a.missing - b.missing)
        .slice(0, 4)
    : [];
  const isToday = (date) => formatDate(date) === todayStr;

  function getPlan(date, mealType) {
    return plans.find((p) => p.date === formatDate(date) && p.mealType === mealType);
  }

  const pantryPreview = pantry.slice(0, PANTRY_PREVIEW_LIMIT);
  const pantryOverflow = pantry.length - PANTRY_PREVIEW_LIMIT;

  return (
    <main className="home-page">
      <div className="home-greeting">
        <h1>{greeting(user.name)}</h1>
        <p className="home-subtitle">Here's your week at a glance.</p>
      </div>

      {/* Stats */}
      <div className="home-stats">
        <div className="stat-card" onClick={() => navigate('/recipes')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><UtensilsCrossed size={22} /></div>
          <div className="stat-body">
            <span className="stat-number">{recipes.length}</span>
            <span className="stat-label">Saved recipes</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/planner')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><CalendarDays size={22} /></div>
          <div className="stat-body">
            <span className="stat-number">{plans.length}</span>
            <span className="stat-label">Meals this week</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/cart')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><ShoppingCart size={22} /></div>
          <div className="stat-body">
            <span className="stat-number">{cartItemCount}</span>
            <span className="stat-label">Cart items</span>
          </div>
        </div>
        <div className="stat-card" onClick={() => navigate('/pantry')} style={{ cursor: 'pointer' }}>
          <div className="stat-icon"><Refrigerator size={22} /></div>
          <div className="stat-body">
            <span className="stat-number">{pantry.length}</span>
            <span className="stat-label">Pantry items</span>
          </div>
        </div>
      </div>

      {/* This week */}
      <section className="home-section">
        <div className="home-section-header">
          <h2>This Week</h2>
          <button className="home-section-link" onClick={() => navigate('/planner')}>View full planner →</button>
        </div>
        <div className="week-strip">
          {weekDates.map((date, i) => {
            const today = isToday(date);
            const dayPlans = MEAL_TYPES.map((m) => getPlan(date, m)).filter(Boolean);
            return (
              <div
                key={i}
                className={`week-day-card ${today ? 'today' : ''} ${dayPlans.length === 0 ? 'empty' : ''}`}
                onClick={() => navigate('/planner')}
              >
                <div className="week-day-label">
                  <span className="week-day-name">{DAYS[i]}</span>
                  <span className="week-day-date">{date.getDate()}</span>
                </div>
                <div className="week-day-meals">
                  {dayPlans.length > 0 ? dayPlans.map((p) => (
                    <div key={p.id} className="week-meal-chip">{p.recipe.title}</div>
                  )) : (
                    <span className="week-day-empty">Nothing planned</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Pantry */}
      <section className="home-section">
        <div className="home-section-header">
          <h2>Pantry</h2>
          <button className="home-section-link" onClick={() => navigate('/pantry')}>
            {pantry.length === 0 ? 'Add items →' : 'Manage →'}
          </button>
        </div>
        {pantry.length === 0 ? (
          <div className="home-empty">
            <p>Your pantry is empty. <button className="home-section-link" onClick={() => navigate('/pantry')}>Add your first item →</button></p>
          </div>
        ) : (
          <div className="home-pantry-chips">
            {pantryPreview.map((item) => (
              <span key={item.id} className="home-pantry-chip">{item.name}</span>
            ))}
            {pantryOverflow > 0 && (
              <button className="home-pantry-more" onClick={() => navigate('/pantry')}>
                +{pantryOverflow} more
              </button>
            )}
          </div>
        )}
      </section>

      {/* Recent recipes */}
      {recentRecipes.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>Recent Recipes</h2>
            <button className="home-section-link" onClick={() => navigate('/recipes')}>View all →</button>
          </div>
          <div className="home-recipe-grid">
            {recentRecipes.map((r) => (
              <div key={r.id} className="home-recipe-card" onClick={() => navigate('/recipes')}>
                <div className="home-recipe-accent" />
                <div className="home-recipe-body">
                  <h3 className="home-recipe-title">{r.title}</h3>
                  <p className="home-recipe-desc">{r.description}</p>
                  <div className="home-recipe-meta">
                    <span className="home-recipe-pill">{r.time}</span>
                    <span className="home-recipe-pill">{r.servings} servings</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Ready to Make */}
      {readyToMake.length > 0 && (
        <section className="home-section">
          <div className="home-section-header">
            <h2>Ready to Make</h2>
            <button className="home-section-link" onClick={() => navigate('/recipes')}>View all →</button>
          </div>
          <div className="home-recipe-grid">
            {readyToMake.map((r) => (
              <div key={r.id} className="home-recipe-card" onClick={() => navigate('/recipes')}>
                <div className="home-recipe-accent" />
                <div className="home-recipe-body">
                  <h3 className="home-recipe-title">{r.title}</h3>
                  <p className="home-recipe-desc">{r.description}</p>
                  <div className="home-recipe-meta">
                    {r.missing === 0 ? (
                      <span className="home-recipe-pill home-recipe-pill--ready">You have everything!</span>
                    ) : (
                      <span className="home-recipe-pill home-recipe-pill--missing">{r.missing} to buy</span>
                    )}
                    {r.time && <span className="home-recipe-pill">{r.time}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {recentRecipes.length === 0 && (
        <section className="home-section">
          <div className="home-empty">
            <p>No recipes yet. <button className="home-section-link" onClick={() => navigate('/recipes')}>Add your first one →</button></p>
          </div>
        </section>
      )}
    </main>
  );
}
