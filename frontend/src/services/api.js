import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor para manejar errores globalmente
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 422) {
            console.error('Error de validación:', error.response.data.detail);
        }
        if (error.response?.status === 500) {
            console.error('Error interno del servidor');
        }
        return Promise.reject(error);
    }
);

export default api;