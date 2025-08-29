// useAuth.jsx
import { useRecoilState } from 'recoil';
import { accessTokenState, authState, loadingState } from '../atoms';
import api from '../api/api';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { message } from 'antd';

const useAuth = () => {
    const navigate = useNavigate();
    const [accessToken, setAccessToken] = useRecoilState(accessTokenState);
    const [auth, setAuth] = useRecoilState(authState);
    const [isLoading, setIsLoading] = useRecoilState(loadingState);


    // Función para iniciar sesión
    const login = async (username, password) => {
        try {
            const response = await api.post('/auth/login', { username, password }, { withCredentials: true });

            
            if (response && response.data.auth) {
                message.success(response.data.message)
                setAccessToken(response.data.accessToken);
                const userLogged = response.data.auth;
                setAuth(userLogged);
                navigate('/');
            } else {
                message.error('Credenciales incorrectas');
            }
        } catch (error) {
            console.log(error);
            message.error(`Error al iniciar sesión: ${error.response?.data?.message}`);
        }
    };

    // Función para cerrar sesión
    const logout = async () => {
        try {
          setIsLoading(true);
            await api.post('/auth/logout', {}, { withCredentials: true });
            setAccessToken('');            
            setAuth(null);
            setIsLoading(false);
            navigate('/login'); // Redirige al usuario después del logout
        } catch (error) {
            console.error('Error al cerrar sesión:', error.response?.data?.message);
            setIsLoading(false);
        }
    };

    // Función para refrescar el access token
    const refreshAccessToken = async () => {
        try {
            const response = await api.post('/auth/refresh-token', {}, { withCredentials: true });
            setAccessToken(response.data.accessToken);
            return response.data.accessToken;
        } catch (error) {
            console.error('Error al refrescar el access token:', error.response?.data?.message);
            setAccessToken('');
            setAuth(null);
            throw error;
        }
    };

    useEffect(() => {
        // Al montar, intenta refrescar el token si no hay accessToken pero hay auth
        const initializeAuth = async () => {
            if (!accessToken && auth) {
                try {
                    await refreshAccessToken();
                } catch (error) {
                    console.error('No se pudo refrescar el accessToken:', error);
                    navigate('/login'); // Redirige al login si no se puede refrescar
                }
            }
        };
        initializeAuth();
    }, [accessToken, auth, navigate]); // Asegúrate de incluir todas las dependencias necesarias

    const isAuthenticated = !!accessToken;

    return {
        accessToken,
        auth,
        isAuthenticated,
        login,
        logout,
        refreshAccessToken,
    };
};

export default useAuth;