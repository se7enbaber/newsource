import { handleUnauthorized } from './authService';

const baseUrl = process.env.NEXT_PUBLIC_API_ADMIN_URL;

async function request(url: string, options: RequestInit = {}) {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;

    const headers = new Headers(options.headers);
    if (token) {
        headers.set('Authorization', `Bearer ${token}`);
    }
    
    // Auto set Content-Type if not FormData
    if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
        headers.set('Content-Type', 'application/json');
    }

    const response = await fetch(`${baseUrl}${url}`, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        handleUnauthorized();
        return null;
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.message || `Request failed with status ${response.status}`);
    }

    // Trả về null nếu không có content (204 No Content), ngược lại parse JSON
    if (response.status === 204) return null;
    return response.json().catch(() => null);
}

export const api = {
    get: (url: string, options?: RequestInit) => request(url, { ...options, method: 'GET' }),
    post: (url: string, body: any, options?: RequestInit) =>
        request(url, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (url: string, body: any, options?: RequestInit) =>
        request(url, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: (url: string, options?: RequestInit) => request(url, { ...options, method: 'DELETE' }),
    upload: (url: string, formData: FormData, tenantId?: string, options?: RequestInit) => {
        const headers = new Headers(options?.headers);
        if (tenantId) headers.set('X-Tenant-Id', tenantId);
        return request(url, { ...options, method: 'POST', body: formData, headers });
    }
};
