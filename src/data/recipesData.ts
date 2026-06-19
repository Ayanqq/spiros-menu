import rawData from './cleaned-recipes.json';
import type { Category, Checklist, Recipe, RecipesDatabase } from '../types/recipes';
import { parseRecipeDescription, type ParsedDescription } from '../utils/parseRecipeDescription';

const db = rawData as RecipesDatabase;

export const recipes: Recipe[] = db.recipes;
export const checklists: Checklist[] = db.checklists;

const parsedDescriptionsById = new Map<string, ParsedDescription>(
  recipes.map((r) => [r.id, parseRecipeDescription(r.description)]),
);

export function getParsedDescription(recipeId: string): ParsedDescription {
  return parsedDescriptionsById.get(recipeId) ?? { sections: [], yield: null, allergens: null, cookTime: null };
}

export function getRecipePreview(recipe: Recipe): string {
  const parsed = getParsedDescription(recipe.id);
  const firstSection = parsed.sections[0];2
  if (firstSection?.ingredients.length) {
    return firstSection.ingredients.slice(0, 3).map((i) => i.name).join(', ');
  }
  if (firstSection?.steps.length) {
    return firstSection.steps[0];
  }
  return '';
}

export interface CategoryWithCount extends Category {
  recipeCount: number;
}

const recipesById = new Map<string, Recipe>(recipes.map((r) => [r.id, r]));
const checklistsById = new Map<string, Checklist>(checklists.map((c) => [c.id, c]));
const recipesByCategoryId = new Map<string, Recipe[]>();
for (const recipe of recipes) {
  const list = recipesByCategoryId.get(recipe.categoryId);
  if (list) {
    list.push(recipe);
  } else {
    recipesByCategoryId.set(recipe.categoryId, [recipe]);
  }
}

const categoriesById = new Map<string, Category>(db.categories.map((c) => [c.id, c]));

export const categories: CategoryWithCount[] = db.categories
  .map((category) => ({
    ...category,
    recipeCount: recipesByCategoryId.get(category.id)?.length ?? 0,
  }))
  .filter((category) => !(category.name === 'Special position' && category.recipeCount === 0));

export function getRecipeById(id: string): Recipe | undefined {
  return recipesById.get(id);
}

export function getCategoryById(id: string): Category | undefined {
  return categoriesById.get(id);
}

export function getRecipesByCategoryId(categoryId: string): Recipe[] {
  return recipesByCategoryId.get(categoryId) ?? [];
}

export function getChecklistsByIds(ids: string[]): Checklist[] {
  return ids.map((id) => checklistsById.get(id)).filter((c): c is Checklist => Boolean(c));
}

function matchesQuery(recipe: Recipe, normalizedQuery: string): boolean {
  return (
    recipe.title.toLowerCase().includes(normalizedQuery) ||
    recipe.description.toLowerCase().includes(normalizedQuery)
  );
}

export function searchRecipes(query: string, pool: Recipe[] = recipes): Recipe[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return [];
  return pool.filter((recipe) => matchesQuery(recipe, normalized));
}
