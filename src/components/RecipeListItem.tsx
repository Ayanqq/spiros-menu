import { Link } from 'react-router-dom';
import type { Recipe } from '../types/recipes';
import { getRecipePreview } from '../data/recipesData';
import HighlightedText from './HighlightedText';
import RecipeImage from './RecipeImage';

interface RecipeListItemProps {
  recipe: Recipe;
  query?: string;
  categoryName?: string;
}

export default function RecipeListItem({ recipe, query = '', categoryName }: RecipeListItemProps) {
  const preview = getRecipePreview(recipe);
  const thumbnail = recipe.gallery[0];

  return (
    <Link
      to={`/recipe/${recipe.id}`}
      className="flex min-h-[44px] gap-3 rounded-2xl border border-neutral-800 bg-neutral-900 p-4 shadow-md transition hover:border-amber-500/60 hover:bg-neutral-800 active:scale-[0.98] sm:p-5"
    >
      {thumbnail && (
        <RecipeImage
          src={thumbnail.url}
          alt={recipe.title}
          className="h-16 w-16 shrink-0 rounded-xl object-cover sm:h-20 sm:w-20"
        />
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="text-lg font-semibold text-neutral-100 sm:text-xl">
            <HighlightedText text={recipe.title} query={query} />
          </h3>
          {recipe.yield && (
            <span className="shrink-0 whitespace-nowrap rounded-full bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 border border-amber-500/40">
              {recipe.yield}
            </span>
          )}
        </div>
        {categoryName && <p className="text-sm text-neutral-500">в категории «{categoryName}»</p>}
        {preview ? (
          <p className="line-clamp-2 text-sm text-neutral-400">{preview}</p>
        ) : (
          <p className="text-sm italic text-neutral-600">Описание отсутствует</p>
        )}
      </div>
    </Link>
  );
}
