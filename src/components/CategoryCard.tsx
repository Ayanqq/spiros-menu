import { Link } from 'react-router-dom';
import type { CategoryWithCount } from '../data/recipesData';

interface CategoryCardProps {
  category: CategoryWithCount;
}

function pluralizeRecipes(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod100 >= 11 && mod100 <= 14) return 'рецептов';
  if (mod10 === 1) return 'рецепт';
  if (mod10 >= 2 && mod10 <= 4) return 'рецепта';
  return 'рецептов';
}

export default function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      to={`/category/${category.id}`}
      className="flex min-h-[110px] flex-col justify-between rounded-2xl border border-neutral-800 bg-neutral-900 p-5 shadow-md transition hover:border-amber-500/60 hover:bg-neutral-800 active:scale-[0.98]"
    >
      <h2 className="text-xl font-semibold text-neutral-100 sm:text-2xl">{category.name}</h2>
      <p className="mt-2 text-base text-amber-400">
        {category.recipeCount} {pluralizeRecipes(category.recipeCount)}
      </p>
    </Link>
  );
}
