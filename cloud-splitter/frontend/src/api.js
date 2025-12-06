const API = import.meta.env.VITE_API_ORIGIN || 'http://localhost:8080';

export function authHeader() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function api(path, opts={}) {
  const res = await fetch(`${API}/api${path}`, {
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers||{}), ...authHeader() },
  });
  if (!res.ok) throw new Error((await res.json()).error || 'Request failed');
  return res.json();
}
