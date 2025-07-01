// src/api/api.js
import axios from 'axios';
import { getRecoil, setRecoil } from 'recoil-nexus';
import { loadingState, accessTokenState, authState } from '../atoms';
// Asegúrate de que authUserState existe para limpiar info de usuario cuando haga logout

// Crear instancia de Axios
const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true, // importante para enviar cookie de refresh-token
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor de request: adjuntar access token
api.interceptors.request.use(
    (config) => {
        setRecoil(loadingState, true);
        const token = getRecoil(accessTokenState);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        setRecoil(loadingState, false);
        return Promise.reject(error);
    }
);

// Función auxiliar para limpiar estado y redirigir
async function handleLogoutCleanup() {
    try {
        // Llamar al endpoint de logout para que el backend borre la cookie refreshToken
        // Usamos una nueva instancia o la misma api. Para evitar bucle de interceptores,
        // podemos usar axios sin interceptores o deshabilitar temporalmente interceptors.
        await axios.post(
            `${import.meta.env.VITE_API_URL}/auth/logout`,
            null,
            {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );
    } catch (err) {
        console.warn('Error llamando endpoint logout en backend:', err);
    }
    // Limpiar Recoil: accessToken y user
    setRecoil(accessTokenState, null);
    // Si tienes authUserState u otro atom, limpiarlo:
    if (authState) {
        setRecoil(authState, null);
    }
    // Redirigir al login. Puedes usar window.location o tu router
    window.location.href = '/login';
}

// Interceptor de response: manejar refresh token y logout
api.interceptors.response.use(
    (response) => {
        setRecoil(loadingState, false);
        return response;
    },
    async (error) => {
        setRecoil(loadingState, false);
        const originalRequest = error.config;

        // Si no hay response o config, rechazar
        if (!error.response || !originalRequest) {
            return Promise.reject(error);
        }

        const status = error.response.status;

        // 401: token inválido o expirado. Hacemos logout
        if (status === 401) {
            // Evitar múltiples llamadas:
            if (!originalRequest._retryLogout) {
                originalRequest._retryLogout = true;
                await handleLogoutCleanup();
            }
            return Promise.reject(error);
        }

        // 403: puedes interpretar como token expirado y tratar de refresh
        // (Solo si tu backend usa 403 para token expirado, de lo contrario usualmente es 401)
        // En tu ejemplo, usabas 403 para refresh. Ajusta según backend.
        if (status === 403 && !originalRequest._retry) {
            originalRequest._retry = true;
            try {
                // Llamar refresh-token: backend debe leer cookie refreshToken y devolver nuevo accessToken
                const res = await api.post('/auth/refresh-token');
                const newAccessToken = res.data.accessToken;
                // Actualizar Recoil
                setRecoil(accessTokenState, newAccessToken);
                // Actualizar encabezado de la solicitud original
                originalRequest.headers['Authorization'] = `Bearer ${newAccessToken}`;
                // Reintentar la solicitud original
                return api(originalRequest);
            } catch (err) {
                console.error('No se pudo refrescar el token:', err);
                // Si falla el refresh, hacemos logout
                await handleLogoutCleanup();
                return Promise.reject(err);
            }
        }

        // Otros errores: rechazar
        return Promise.reject(error);
    }
);

export default api;
