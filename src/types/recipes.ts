export interface GalleryImage {
  url: string;
  width?: number;
  height?: number;
}

export interface Ingredient {
  name: string;
  amount: string;
}

export interface Step {
  order: number;
  text: string;
}

export interface ChecklistItem {
  text?: string;
  name?: string;
}

export interface Checklist {
  name?: string;
  items?: (string | ChecklistItem)[];
}

export interface Recipe {
  id: string;
  title: string;
  categoryId: string;
  categoryName: string;
  gallery: GalleryImage[];
  ingredients: Ingredient[];
  steps: Step[];
  yield: string;
  notes: string;
  checklists: Checklist[];
}

export interface Category {
  id: string;
  name: string;
  recipeCount: number;
}
