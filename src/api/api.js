// src/api/api.js

import axios from 'axios';
import { getRecoil, setRecoil } from 'recoil-nexus';
import { loadingState, accessTokenState, authState } from '../atoms';
import { message } from 'antd';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: { 'Content-Type': 'application/json' },
});

// Petición normal: ponemos loading y adjuntamos accessToken
api.interceptors.request.use(
    config => {
        setRecoil(loadingState, true);
        const token = getRecoil(accessTokenState);
        if (token) config.headers.Authorization = `Bearer ${token}`;
        return config;
    },
    err => {
        setRecoil(loadingState, false);
        return Promise.reject(err);
    }
);

// Función interna para refrescar token sin ciclos infinitos
let isRefreshing = false;
let pendingRequests = [];

async function tryRefreshToken() {
    if (isRefreshing) {
        // Si ya hay un refresh en curso, esperamos a que termine
        return new Promise((resolve, reject) => {
            pendingRequests.push({ resolve, reject });
        });
    }
    isRefreshing = true;
    try {
        
        const res = await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/refresh-token`,{},{ withCredentials: true }
        );
        const newToken = res.data.accessToken;
        // Actualizo Recoil
        setRecoil(accessTokenState, newToken);
        // Resolviendo todas las peticiones en espera
        pendingRequests.forEach(p => p.resolve(newToken));
        pendingRequests = [];
        return newToken;
    } catch (err) {
        // Si falla refrescar, limpio estado y rechazo todas
        setRecoil(accessTokenState, '');
        setRecoil(authState, null);
        pendingRequests.forEach(p => p.reject(err));
        pendingRequests = [];
        throw err;
    } finally {
        isRefreshing = false;
    }
}

// Interceptor de respuestas
api.interceptors.response.use(
    response => {
        setRecoil(loadingState, false);
        return response;
    },
    async error => {
        setRecoil(loadingState, false);

        const originalRequest = error.config;
        if (!error.response || !originalRequest) return Promise.reject(error);

        const status = error.response.status;

        // Si recibimos 401 ó 403, tratamos de refrescar el token
        if ((status === 401 || status === 403) && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                const newToken = await tryRefreshToken();
                // Actualizar header y reintentar la llamada original
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return api(originalRequest);
            } catch (err) {
                // Si falla refrescar: redirigimos al login limpiando estado
                message.error('La sesión expiró. Por favor, ingresa de nuevo.');
                window.location.href = '/login';
                return Promise.reject(err);
            }
        }

        // Otros errores
        return Promise.reject(error);
    }
);

export default api;
