import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import SearchInput from '../components/SearchInput';
import RecipeListItem from '../components/RecipeListItem';
import BackLink from '../components/BackLink';
import { getCategoryById, getRecipesByCategory, searchRecipes } from '../data/recipesData';

export default function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const [query, setQuery] = useState('');

  const category = id ? getCategoryById(id) : undefined;
  const categoryRecipes = useMemo(() => (id ? getRecipesByCategory(id) : []), [id]);

  const visibleRecipes = useMemo(() => {
    const trimmed = query.trim();
    return trimmed ? searchRecipes(trimmed, categoryRecipes) : categoryRecipes;
  }, [query, categoryRecipes]);

  if (!category) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-10 text-center">
        <p className="text-xl text-neutral-300">Категория не найдена</p>
        <Link to="/" className="mt-4 inline-block text-amber-400 underline">
          Вернуться на главную
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <BackLink to="/" label="Все категории" />

      <h1 className="mb-6 mt-4 text-3xl font-bold text-neutral-100 sm:text-4xl">{category.name}</h1>

      <SearchInput value={query} onChange={setQuery} placeholder={`Поиск в категории «${category.name}»...`} />

      <p className="mt-4 mb-4 text-base text-neutral-500">
        {visibleRecipes.length} {visibleRecipes.length === 1 ? 'рецепт' : 'рецептов'}
      </p>

      {visibleRecipes.length === 0 ? (
        <p className="mt-12 text-center text-lg text-neutral-500">Ничего не найдено</p>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleRecipes.map((recipe) => (
            <RecipeListItem key={recipe.id} recipe={recipe} query={query} />
          ))}
        </div>
      )}
    </div>
  );
}
