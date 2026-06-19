import { useState, type FormEvent } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export default function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const [loginValue, setLoginValue] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const success = login(loginValue, password);
    if (!success) {
      setError('Неверный логин или пароль');
      setPassword('');
      return;
    }

    setError('');
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-8 text-center text-3xl font-bold text-neutral-100 sm:text-4xl">Технологические карты</h1>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-neutral-800 bg-neutral-900 p-6 shadow-md"
        >
          <div>
            <label htmlFor="login" className="mb-2 block text-base font-medium text-neutral-300">
              Логин
            </label>
            <input
              id="login"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              autoFocus
              value={loginValue}
              onChange={(e) => setLoginValue(e.target.value)}
              className="w-full rounded-2xl bg-neutral-800 border border-neutral-700 px-4 py-4 text-lg text-neutral-100 placeholder-neutral-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-2 block text-base font-medium text-neutral-300">
              Пароль
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-2xl bg-neutral-800 border border-neutral-700 px-4 py-4 text-lg text-neutral-100 placeholder-neutral-500 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/30 transition"
            />
          </div>

          {error && <p className="text-base text-red-400">{error}</p>}

          <button
            type="submit"
            className="mt-2 w-full rounded-2xl bg-amber-500 px-4 py-4 text-lg font-semibold text-neutral-950 transition hover:bg-amber-400 active:scale-[0.98]"
          >
            Войти
          </button>
        </form>
      </div>
    </div>
  );
}
