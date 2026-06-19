import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SearchInput from '../components/SearchInput';
import CategoryCard from '../components/CategoryCard';
import RecipeListItem from '../components/RecipeListItem';
import { categories, getCategoryById, searchRecipes } from '../data/recipesData';
import { useAuth } from '../auth/AuthContext';

export default function HomePage() {
  const [query, setQuery] = useState('');
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const results = useMemo(() => searchRecipes(query), [query]);
  const isSearching = query.trim().length > 0;

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 sm:py-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        {user && <p className="text-base text-neutral-400">{user.name}</p>}
        <button
          type="button"
          onClick={handleLogout}
          className="ml-auto inline-flex min-h-[44px] items-center gap-2 rounded-xl px-3 py-2 -mr-3 text-base font-medium text-neutral-300 transition hover:bg-neutral-800 hover:text-amber-400 active:scale-[0.98]"
        >
          Выйти
        </button>
      </div>

      <h1 className="mb-6 text-3xl font-bold text-neutral-100 sm:text-4xl">Технологические карты</h1>

      <SearchInput value={query} onChange={setQuery} placeholder="Поиск по всем рецептам..." />

      {isSearching ? (
        <div className="mt-6">
          <p className="mb-4 text-base text-neutral-500">
            Найдено {results.length} {results.length === 1 ? 'рецепт' : 'рецептов'}
          </p>
          {results.length === 0 ? (
            <p className="mt-12 text-center text-lg text-neutral-500">Ничего не найдено</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((recipe) => (
                <RecipeListItem
                  key={recipe.id}
                  recipe={recipe}
                  query={query}
                  categoryName={getCategoryById(recipe.categoryId)?.name}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => (
            <CategoryCard key={category.id} category={category} />
          ))}
        </div>
      )}
    </div>
  );
}
