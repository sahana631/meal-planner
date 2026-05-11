export function isInPantry(ingredientStr, pantryNames) {
  const lower = ingredientStr.toLowerCase();
  return Array.from(pantryNames).some((name) => {
    const words = name.split(/\s+/);
    return words.every((word) => lower.includes(word));
  });
}
