// src/components/Login.jsx
import React, { useState } from 'react';
import './Login.css';
import logoFooter from '../../public/logo_footer.png';
import { loadingState } from '../atoms/loadingState';
import { useRecoilState } from 'recoil';
import useAuth from '../hooks/useAuth';

export const Login = () => {
    const [isLoading, setIsLoading] = useRecoilState(loadingState);
    const { login, isAuthenticated, register } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');


    const handleSubmit = async (event) => {
        event?.preventDefault(); // Prevenir el comportamiento por defecto del formulario
        setIsLoading(true);
        await login(email, password);
        setIsLoading(false);
    };

    return (
        <div className="login-page">
            {/* Zona de contenido: formulario centrado */}
            <div className="login-content">
                <div className="login-container">
                    <h2>Iniciar Sesión</h2>
                    {error && <div className="error-message">{error}</div>}
                    <form onSubmit={handleSubmit}>
                        <label htmlFor="email">Correo electrónico</label>
                        <input
                            id="email"
                            type="email"
                            placeholder="tu@correo.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <label htmlFor="password">Contraseña</label>
                        <input
                            id="password"
                            type="password"
                            placeholder="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        <button type="submit">Entrar</button>
                    </form>
                </div>
            </div>

            {/* Footer “local” al pie de la pantalla de login */}
            <footer className="footer-banner">
                <img src={logoFooter} alt="Banner de logos" />
            </footer>
        </div>
    );
};
