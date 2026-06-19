export interface AppUser {
  login: string;
  password: string;
  name: string;
}

export const USERS: AppUser[] = [
  { login: 'admin', password: 'admin123', name: 'Admin' },
];

export function findUser(login: string, password: string): AppUser | undefined {
  const normalizedLogin = login.trim().toLowerCase();
  return USERS.find((u) => u.login.toLowerCase() === normalizedLogin && u.password === password);
}
