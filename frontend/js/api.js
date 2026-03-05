// detect if we are running on a different port than the backend (default 3000)
const backendPort = 3000;
const isDevServer = window.location.port && window.location.port !== backendPort.toString();const API_BASE_URL = isDevServer ? `http://localhost:${backendPort}` : 'https://kgl-system-hqtw.onrender.com/'; // Replace with your actual backend URL


const api = {
    async request(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const session = JSON.parse(localStorage.getItem('currentSession'));
        
        const headers = {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        };

        if (session && session.token) {
            headers['Authorization'] = `Bearer ${session.token}`;
        }

        try {
            const response = await fetch(url, {
                ...options,
                headers
            });

            if (!response.ok) {
                let errorMessage = 'An error occurred';
                const clonedResponse = response.clone();
                try {
                    const errorData = await response.json();
                    errorMessage = errorData.error || response.statusText;
                } catch (e) {
                    const text = await clonedResponse.text();
                    console.error('Server returned non-JSON response:', text);
                    errorMessage = `Server Error (${response.status}): ${response.statusText}`;
                }
                throw new Error(errorMessage);
            }

            return response.json();
        } catch (error) {
            console.error('API Request failed:', error);
            throw error;
        }
    },

    get(endpoint) {
        return this.request(endpoint, { method: 'GET' });
    },

    post(endpoint, data) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },

    put(endpoint, data) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    },

    patch(endpoint, data) {
        return this.request(endpoint, {
            method: 'PATCH',
            body: JSON.stringify(data)
        });
    },

    delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }
};

window.api = api;
