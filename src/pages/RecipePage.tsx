import { Link, useParams } from 'react-router-dom';
import BackLink from '../components/BackLink';
import RecipeGallery from '../components/RecipeGallery';
import NotesSection from '../components/NotesSection';
import ChecklistsSection from '../components/ChecklistsSection';
import { getRecipeById } from '../data/recipesData';

export default function RecipePage() {
  const { id } = useParams<{ id: string }>();
  const recipe = id ? getRecipeById(id) : undefined;

  if (!recipe) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-xl text-neutral-300">Рецепт не найден</p>
        <Link to="/" className="mt-4 inline-block text-amber-400 underline">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  const hasGallery = recipe.gallery.length > 0;
  const hasIngredients = recipe.ingredients.length > 0;
  const hasSteps = recipe.steps.length > 0;
  const hasYield = recipe.yield.trim().length > 0;
  const hasNotes = recipe.notes.trim().length > 0;
  const sortedSteps = hasSteps ? [...recipe.steps].sort((a, b) => a.order - b.order) : [];

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <BackLink to={`/category/${recipe.categoryId}`} label="Назад" />

      <div className="mt-4">
        <Link
          to={`/category/${recipe.categoryId}`}
          className="text-sm font-medium text-neutral-500 hover:text-amber-400"
        >
          {recipe.categoryName}
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-neutral-100 sm:text-3xl">{recipe.title}</h1>
      </div>

      {hasGallery && <RecipeGallery images={recipe.gallery} title={recipe.title} />}

      {hasYield && (
        <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-400/80">Выход</p>
          <p className="text-2xl font-bold text-amber-300 sm:text-3xl">{recipe.yield}</p>
        </div>
      )}

      <div className="mt-6 space-y-5">
        {(hasIngredients || hasSteps) && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5 sm:p-6">
            {hasIngredients && (
              <div className={hasSteps ? 'mb-6' : ''}>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  Ингредиенты
                </h2>
                <ul className="space-y-2.5">
                  {recipe.ingredients.map((ingredient, i) => (
                    <li key={i} className="flex items-baseline justify-between gap-4 text-lg text-neutral-200">
                      <span className="leading-snug">{ingredient.name}</span>
                      {ingredient.amount && (
                        <span className="shrink-0 whitespace-nowrap font-semibold text-amber-300">
                          {ingredient.amount}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {hasSteps && (
              <div>
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-neutral-500">
                  Приготовление
                </h2>
                <ol className="space-y-4">
                  {sortedSteps.map((step, i) => (
                    <li key={i} className="flex gap-4 text-lg leading-relaxed text-neutral-200 sm:text-xl">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-500/15 text-base font-bold text-amber-400">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{step.text}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        )}

        {!hasIngredients && !hasSteps && (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
            <p className="text-xl font-medium text-neutral-500">Описание отсутствует</p>
          </div>
        )}

        {hasNotes && <NotesSection notes={recipe.notes} />}

        <ChecklistsSection checklists={recipe.checklists} />
      </div>
    </div>
  );
}
