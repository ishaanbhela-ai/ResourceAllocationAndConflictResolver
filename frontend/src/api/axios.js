import axios from 'axios';

const instance = axios.create({
    baseURL: 'http://localhost:8080', // Update with your backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token to headers
instance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor to handle token expiration
instance.interceptors.response.use(
    (response) => response,
    (error) => {
        // Only redirect on 401 if user is already logged in (has a token)
        // Don't redirect on login page or when logging in
        if (error.response && error.response.status === 401) {
            const token = localStorage.getItem('token');
            const isLoginPage = window.location.pathname === '/login';

            // Only redirect if user has a token AND is not on login page
            if (token && !isLoginPage) {
                localStorage.removeItem('token');
                localStorage.removeItem('role');
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

export default instance;