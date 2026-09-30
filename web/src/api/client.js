export function userId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || 'null');
    return localStorage.getItem('userId')
      || localStorage.getItem('user_id')
      || user?.id
      || user?._id
      || user?.email
      || 'guest-user';
  } catch {
    return localStorage.getItem('userId') || 'guest-user';
  }
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  const token = localStorage.getItem('token') || localStorage.getItem('jwt');
  if (token && !headers.Authorization) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(path, { ...options, headers });
  const text = await res.text();
  let data = {};
  try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }
  if (!res.ok) {
    const err = new Error(data.error || data.message || res.statusText || 'Request failed');
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

export const get = (path) => api(path);
export const post = (path, body) => api(path, { method: 'POST', body: JSON.stringify(body) });
