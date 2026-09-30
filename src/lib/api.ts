export const getBackendHost = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000';
    }
    return 'https://server.msmeloan.sbs';
  }
  return 'https://server.msmeloan.sbs';
};

export const resolveMediaUrl = (val?: any): string => {
  if (!val) return '';
  if (typeof val === 'object') {
    if (val.base64 && typeof val.base64 === 'string') return val.base64;
    if (val.preview && typeof val.preview === 'string') return resolveMediaUrl(val.preview);
    if (val.url && typeof val.url === 'string') return resolveMediaUrl(val.url);
    if (val.path && typeof val.path === 'string') return resolveMediaUrl(val.path);
    if (val.file && typeof val.file === 'string') return resolveMediaUrl(val.file);
    return '';
  }
  if (typeof val !== 'string') return '';
  const trimmed = val.trim();
  if (!trimmed) return '';

  if (trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  const host = getBackendHost();
  const cleanPath = trimmed.startsWith('/') ? trimmed.substring(1) : trimmed;

  if (cleanPath.startsWith('storage/') || cleanPath.startsWith('uploads/')) {
    return `${host}/${cleanPath}`;
  }

  if (!cleanPath.includes('/')) {
    return `${host}/storage/documents/${cleanPath}`;
  }

  return `${host}/${cleanPath}`;
};

export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://127.0.0.1:8000/api';
    }
    return 'https://server.msmeloan.sbs/api';
  }
  return 'https://server.msmeloan.sbs/api';
};

export const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const localToken = localStorage.getItem('openscore_token');
    if (localToken) return localToken;

    // Cookie fallback
    const match = document.cookie.match(new RegExp('(^| )openscore_auth_token=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
  }
  return null;
};

export const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    const localRefToken = localStorage.getItem('openscore_refresh_token');
    if (localRefToken) return localRefToken;

    const match = document.cookie.match(new RegExp('(^| )openscore_refresh_token=([^;]+)'));
    if (match) return decodeURIComponent(match[2]);
  }
  return null;
};

export const setAuthToken = (accessToken: string, refreshToken?: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('openscore_token', accessToken);
    document.cookie = `openscore_auth_token=${encodeURIComponent(accessToken)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;

    if (refreshToken) {
      localStorage.setItem('openscore_refresh_token', refreshToken);
      document.cookie = `openscore_refresh_token=${encodeURIComponent(refreshToken)}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
    }
  }
};

export const removeAuthToken = () => {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('openscore_token');
    localStorage.removeItem('openscore_refresh_token');
    localStorage.removeItem('openscore_user');
    localStorage.removeItem('active_loan_app_id');

    // Wipe all local step & application state keys
    Object.keys(localStorage).forEach((key) => {
      if (
        key.startsWith('active_') ||
        key.startsWith('loan_') ||
        key.startsWith('resume_') ||
        key.startsWith('step_') ||
        key.includes('application')
      ) {
        localStorage.removeItem(key);
      }
    });

    localStorage.clear();
    sessionStorage.clear();
    document.cookie = 'openscore_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    document.cookie = 'openscore_refresh_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
};

export const getCachedUser = () => {
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('openscore_user') || localStorage.getItem('user');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
  }
  return null;
};

export const setCachedUser = (user: any) => {
  if (typeof window !== 'undefined' && user) {
    try {
      localStorage.setItem('openscore_user', JSON.stringify(user));
      localStorage.setItem('user', JSON.stringify(user));
    } catch (e) {}
  }
};

let isRefreshing = false;
let refreshSubscribers: ((newToken: string) => void)[] = [];

const onRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((cb) => cb(newToken));
  refreshSubscribers = [];
};

export async function refreshAuthToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${refreshToken}`,
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (res.ok) {
      const data = await res.json();
      const newAccessToken = data.access_token || data.token;
      const newRefreshToken = data.refresh_token || refreshToken;

      if (newAccessToken) {
        setAuthToken(newAccessToken, newRefreshToken);
        if (data.user) setCachedUser(data.user);
        return newAccessToken;
      }
    }
  } catch (err) {
    console.error('Failed to refresh authentication token:', err);
  }

  // If refresh failed, clear tokens
  removeAuthToken();
  return null;
}

export async function apiRequest(endpoint: string, options: RequestInit = {}): Promise<any> {
  const token = getAuthToken();
  const baseUrl = getApiBaseUrl();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${baseUrl}${endpoint}`, {
    credentials: options.credentials || 'same-origin',
    ...options,
    headers,
  });

  // Handle 401 Unauthorized -> Automatic token refresh & request retry
  if (response.status === 401 && !endpoint.includes('/refresh') && !endpoint.includes('/login')) {
    if (!isRefreshing) {
      isRefreshing = true;
      const newAccessToken = await refreshAuthToken();
      isRefreshing = false;

      if (newAccessToken) {
        onRefreshed(newAccessToken);
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        response = await fetch(`${baseUrl}${endpoint}`, {
          credentials: options.credentials || 'same-origin',
          ...options,
          headers,
        });
      }
    } else {
      const retryToken = await new Promise<string>((resolve) => {
        refreshSubscribers.push((newToken: string) => resolve(newToken));
      });
      headers['Authorization'] = `Bearer ${retryToken}`;
      response = await fetch(`${baseUrl}${endpoint}`, {
        credentials: options.credentials || 'same-origin',
        ...options,
        headers,
      });
    }
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.message || data.error || 'An error occurred during request';
    const err: any = new Error(errorMsg);
    err.status = response.status;
    throw err;
  }

  return data;
}
