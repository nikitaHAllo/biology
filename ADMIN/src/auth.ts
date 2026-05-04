const KEY = 'admin_token';

export const auth = {
  getToken: (): string | null => sessionStorage.getItem(KEY),
  setToken: (token: string) => sessionStorage.setItem(KEY, token),
  clear: () => sessionStorage.removeItem(KEY),
  isLoggedIn: () => !!sessionStorage.getItem(KEY),
};
