export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
export const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:4000';

export async function fetchApi<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ifam_token') : null;

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data: any;

  try {
    data = JSON.parse(text);
  } catch (err) {
    if (!response.ok) {
      throw new Error(`Erro no servidor HTTP (${response.status}). O backend retornou conteúdo não-JSON.`);
    }
    data = text;
  }

  if (!response.ok) {
    if (response.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('ifam_token');
      localStorage.removeItem('ifam_user');
      window.dispatchEvent(new Event('ifam_auth_expired'));
    }
    throw new Error(data.error || data.message || `Erro HTTP ${response.status} na requisição.`);
  }

  return data as T;
}
