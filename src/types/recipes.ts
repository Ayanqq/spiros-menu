export interface ChecklistItem {
  id: string;
  name: string;
  checked: boolean;
}

export interface Checklist {
  id: string;
  name: string;
  cardId: string;
  items: ChecklistItem[];
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  checklistIds: string[];
}

export interface Category {
  id: string;
  name: string;
  recipes: Recipe[];
}

export interface RecipesDatabase {
  categories: Category[];
  recipes: Recipe[];
  checklists: Checklist[];
}
