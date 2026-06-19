import { Link, useParams } from 'react-router-dom';
import BackLink from '../components/BackLink';
import Chip from '../components/Chip';
import SectionBlock from '../components/SectionBlock';
import { getCategoryById, getChecklistsByIds, getParsedDescription, getRecipeById } from '../data/recipesData';

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

  const category = getCategoryById(recipe.categoryId);
  const parsed = getParsedDescription(recipe.id);
  const checklists = getChecklistsByIds(recipe.checklistIds);
  const hasDescription = parsed.sections.length > 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6 sm:py-10">
      <BackLink to={category ? `/category/${category.id}` : '/'} label="Назад" />

      <div className="mt-4">
        {category && (
          <Link
            to={`/category/${category.id}`}
            className="text-sm font-medium text-neutral-500 hover:text-amber-400"
          >
            {category.name}
          </Link>
        )}
        <h1 className="mt-1 text-2xl font-bold text-neutral-100 sm:text-3xl">{recipe.title}</h1>
      </div>

      {parsed.yield && (
        <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 px-5 py-4">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-400/80">Выход</p>
          <p className="text-2xl font-bold text-amber-300 sm:text-3xl">{parsed.yield}</p>
        </div>
      )}

      {(parsed.cookTime || parsed.allergens) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {parsed.cookTime && <Chip variant="amber">⏱ {parsed.cookTime}</Chip>}
          {parsed.allergens && <Chip>Аллергены: {parsed.allergens}</Chip>}
        </div>
      )}

      <div className="mt-6 space-y-5">
        {hasDescription ? (
          parsed.sections.map((section, i) => <SectionBlock key={i} section={section} />)
        ) : (
          <div className="rounded-2xl border border-neutral-800 bg-neutral-900 p-8 text-center">
            <p className="text-xl font-medium text-neutral-500">Описание отсутствует</p>
          </div>
        )}

        {checklists.length > 0 && (
          <div className="space-y-3">
            {checklists.map((checklist) => (
              <div key={checklist.id} className="rounded-2xl border border-neutral-800 bg-neutral-900 p-5">
                <p className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Чек-лист</p>
                <p className="mt-1 text-lg font-medium text-neutral-200">{checklist.name}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
