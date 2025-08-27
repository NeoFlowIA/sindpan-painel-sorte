const API_BASE = import.meta.env.VITE_API_BASE || '';

export async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('auth_token');
  
  const config: RequestInit = {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...init.headers,
    },
  };

  try {
    const response = await fetch(`${API_BASE}${path}`, config);
    
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('auth_token');
      
      // Only redirect if we're not already on the login page
      if (window.location.pathname !== '/entrar') {
        window.location.href = '/entrar';
      }
    }
    
    return response;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}