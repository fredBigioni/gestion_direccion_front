import React, { useState } from 'react';
import './navbar.css';
import { FaUserCircle } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';
// 👉 importamos package.json y leemos la versión
import pkg from '../../../package.json';

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [configOpen, setConfigOpen] = useState(false);
  const { logout } = useAuth();

  const appVersion = pkg?.version ?? '0.0.0';

  const toggleMenu = () => setMenuOpen(prev => !prev);

  const handleLogout = () => {
    console.log('Cerrar sesión');
    logout();
  };

  const openConfig = () => {
    setMenuOpen(false);
    setConfigOpen(true);
  };

  const closeConfig = () => setConfigOpen(false);

  return (
    <nav className="navbar">
      <div className="navbar__left">
        <img
          src="/Logo_Grupo.png"
          alt="Grupo Roemmers"
          className="navbar__logo"
        />
      </div>

      <div className="navbar__center" />

      <div className="navbar__right">
        <div className="navbar__avatar" onClick={toggleMenu}>
          <FaUserCircle size={28} color="#eee" />
        </div>

        {menuOpen && (
          <div className="navbar__menu">
            <div className="navbar__menu-item" onClick={openConfig}>
              Configuración
            </div>
            <div className="navbar__menu-item" onClick={handleLogout}>
              Logout
            </div>
          </div>
        )}
      </div>

      {/* Pop-up simple con la versión */}
      {configOpen && (
        <div
          className="navbar__modal-overlay"
          onClick={closeConfig}
          role="presentation"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999
          }}
        >
          <div
            className="navbar__modal"
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: 8,
              padding: '20px 24px',
              width: 'min(90vw, 380px)',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}
          >
            <h3 style={{ margin: 0, marginBottom: 8 }}>Configuración</h3>
            <p style={{ margin: 0, marginBottom: 16 }}>
              Versión de la aplicación: <strong>{appVersion}</strong>
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button
                onClick={closeConfig}
                style={{
                  padding: '8px 12px',
                  borderRadius: 6,
                  border: '1px solid #ddd',
                  background: '#f6f6f6',
                  cursor: 'pointer'
                }}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};
