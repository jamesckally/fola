// API client utility for making authenticated requests to backend
type FetchOptions = RequestInit & {
    params?: Record<string, string>;
};

class APIClient {
    private baseURL: string;

    constructor(baseURL: string = '/api') {
        this.baseURL = baseURL;
    }

    private async request<T>(
        endpoint: string,
        options: FetchOptions = {}
    ): Promise<T> {
        const { params, ...fetchOptions } = options;

        let url = `${this.baseURL}${endpoint}`;

        if (params) {
            const searchParams = new URLSearchParams(params);
            url += `?${searchParams.toString()}`;
        }

        const response = await fetch(url, {
            ...fetchOptions,
            headers: {
                'Content-Type': 'application/json',
                ...fetchOptions.headers,
            },
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: 'Request failed' }));
            throw new Error(error.error || `HTTP ${response.status}`);
        }

        return response.json();
    }

    async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
        return this.request<T>(endpoint, { method: 'GET', params });
    }

    async post<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    }

    async put<T>(endpoint: string, data?: any): Promise<T> {
        return this.request<T>(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    }

    async delete<T>(endpoint: string): Promise<T> {
        return this.request<T>(endpoint, { method: 'DELETE' });
    }
}

export const apiClient = new APIClient();

// Typed API methods
export const api = {
    user: {
        getProfile: () => apiClient.get('/user/profile'),
    },
    balances: {
        getAll: () => apiClient.get('/balances'),
    },
    transactions: {
        getAll: () => apiClient.get('/transactions'),
        send: (data: { recipient: string; amount: string; token: string; memo?: string }) =>
            apiClient.post('/transactions', data),
    },
    tags: {
        get: () => apiClient.get('/tags'),
        purchase: (data: { tagName: string; txHash: string }) =>
            apiClient.post('/tags', data),
    },
    wallet: {
        generate: () => apiClient.post('/wallet/generate'),
        verify: (data: { wordIndices: number[]; providedWords: string[] }) =>
            apiClient.post('/wallet/verify', data),
        recover: (data: { mnemonic: string }) =>
            apiClient.post('/wallet/recover', data),
    },
};
