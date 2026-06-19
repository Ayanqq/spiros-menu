import rawRecipes from './cleaned-recipes.json';
import type { Category, Recipe } from '../types/recipes';

export const recipes: Recipe[] = rawRecipes as Recipe[];

const recipesById = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));

const recipesByCategoryId = new Map<string, Recipe[]>();
for (const recipe of recipes) {
  const list = recipesByCategoryId.get(recipe.categoryId);
  if (list) {
    list.push(recipe);
  } else {
    recipesByCategoryId.set(recipe.categoryId, [recipe]);
  }
}

function buildCategories(): Category[] {
  const byId = new Map<string, Category>();
  for (const recipe of recipes) {
    const existing = byId.get(recipe.categoryId);
    if (existing) {
      existing.recipeCount += 1;
    } else {
      byId.set(recipe.categoryId, {
        id: recipe.categoryId,
        name: recipe.categoryName,
        recipeCount: 1,
      });
    }
  }
  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name, 'ru'));
}

export const categories: Category[] = buildCategories();

export function getCategories(): Category[] {
  return categories;
}

const categoriesById = new Map<string, Category>(categories.map((c) => [c.id, c]));

export function getCategoryById(id: string): Category | undefined {
  return categoriesById.get(id);
}

export function getRecipeById(id: string): Recipe | undefined {
  return recipesById.get(id);
}

export function getRecipesByCategory(categoryId: string): Recipe[] {
  return recipesByCategoryId.get(categoryId) ?? [];
}

export function getRecipePreview(recipe: Recipe): string {
  if (recipe.ingredients.length) {
    return recipe.ingredients.slice(0, 3).map((i) => i.name).join(', ');
  }
  if (recipe.steps.length) {
    return recipe.steps[0].text;
  }
  return '';
}

function matchesQuery(recipe: Recipe, normalizedQuery: string): boolean {
  if (recipe.title.toLowerCase().includes(normalizedQuery)) return true;
  if (recipe.ingredients.some((i) => i.name.toLowerCase().includes(normalizedQuery))) return true;
  if (recipe.steps.some((s) => s.text.toLowerCase().includes(normalizedQuery))) return true;
  if (recipe.notes && recipe.notes.toLowerCase().includes(normalizedQuery)) return true;
  return false;
}

export function searchRecipes(query: string, pool: Recipe[] = recipes): Recipe[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return pool.filter((recipe) => matchesQuery(recipe, normalized));
}
