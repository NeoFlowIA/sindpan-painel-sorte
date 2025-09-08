// SINDPAN Auth API Service
// Base URL: https://neotalks-sindpan-auth.t2wird.easypanel.host

// Base URL configuration with environment support
const getBaseUrl = () => {
  // First, check for custom environment variable
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  
  // Development: use proxy
  if (import.meta.env.DEV) {
    return '/api';
  }
  
  // Production: direct API URL
  return 'https://neotalks-sindpan-auth.t2wird.easypanel.host';
};

const BASE_URL = getBaseUrl();

// Log configuration in development
if (import.meta.env.DEV) {
  console.log('🔧 SINDPAN API Configuration:');
  console.log('📍 Base URL:', BASE_URL);
  console.log('🌍 Environment:', import.meta.env.MODE);
}

// Types for API responses
export interface User {
  id: string;
  email?: string;
  cnpj?: string;
  role: string;
  bakery_name?: string;
  created_at?: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface RegisterData {
  email?: string;
  cnpj?: string;
  password: string;
  bakery_name?: string;
}

export interface LoginData {
  email?: string;
  cnpj?: string;
  password: string;
}

// API Error class
export class SindpanApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public statusText: string
  ) {
    super(message);
    this.name = 'SindpanApiError';
  }
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}`;
    
    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // If can't parse JSON, use status text
      errorMessage = response.statusText || errorMessage;
    }
    
    throw new SindpanApiError(errorMessage, response.status, response.statusText);
  }
  
  return response.json();
}

// Helper to make requests with CORS handling
async function makeRequest(url: string, options: RequestInit = {}): Promise<Response> {
  try {
    // First try with normal fetch
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
    return response;
  } catch (error) {
    // If CORS error and we're in development, suggest proxy usage
    if (error instanceof TypeError && error.message.includes('fetch')) {
      console.error('🚨 CORS Error Detected!');
      console.log('💡 Possible solutions:');
      console.log('1. Make sure the dev server is running with proxy configuration');
      console.log('2. Contact the API team to configure CORS headers');
      console.log('3. Use a browser extension to disable CORS (not recommended for production)');
    }
    throw error;
  }
}

// Get auth token from localStorage
function getAuthToken(): string | null {
  return localStorage.getItem('sindpan_access_token');
}

// Set auth token in localStorage
function setAuthToken(token: string): void {
  localStorage.setItem('sindpan_access_token', token);
}

// Remove auth token from localStorage
function removeAuthToken(): void {
  localStorage.removeItem('sindpan_access_token');
}

// API endpoints
export const sindpanAuthApi = {
  // 1) Healthcheck
  async healthcheck(): Promise<{ ok: boolean }> {
    const response = await makeRequest(`${BASE_URL}/health`);
    return handleResponse(response);
  },

  // 2) Register bakery
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await makeRequest(`${BASE_URL}/auth/register`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse<AuthResponse>(response);
    
    // Store token after successful registration
    if (result.accessToken) {
      setAuthToken(result.accessToken);
    }
    
    return result;
  },

  // 3) Login (bakery or admin)
  async login(data: LoginData): Promise<AuthResponse> {
    const response = await makeRequest(`${BASE_URL}/auth/login`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
    
    const result = await handleResponse<AuthResponse>(response);
    
    // Store token after successful login
    if (result.accessToken) {
      setAuthToken(result.accessToken);
    }
    
    return result;
  },

  // 4) Get authenticated user profile
  async getProfile(): Promise<{ user: User }> {
    const token = getAuthToken();
    
    if (!token) {
      throw new SindpanApiError('No access token found', 401, 'Unauthorized');
    }
    
    const response = await makeRequest(`${BASE_URL}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    return handleResponse(response);
  },

  // Logout (clear token)
  logout(): void {
    removeAuthToken();
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!getAuthToken();
  },

  // Get stored token
  getToken(): string | null {
    return getAuthToken();
  }
};
