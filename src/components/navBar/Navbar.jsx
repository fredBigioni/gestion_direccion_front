import React, { useState } from 'react';
import './navbar.css';
import { FaUserCircle } from 'react-icons/fa';
import useAuth from '../../hooks/useAuth';

export const Navbar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const { logout } = useAuth();

  const toggleMenu = () => setMenuOpen(prev => !prev);

  const handleLogout = () => {
    // lógica real de logout
    console.log('Cerrar sesión');
    logout();
  };

  return (
    <nav className="navbar">
      <div className="navbar__left">
        <img
          src="/Logo_Grupo.png"
          alt="Grupo Roemmers"
          className="navbar__logo"
        />
      </div>

      <div className="navbar__center">
        <span className="navbar__item">USUARIOS</span>
        <span className="navbar__item">COMPAÑÍAS</span>
      </div>

      <div className="navbar__right">
        <div className="navbar__avatar" onClick={toggleMenu}>
          <FaUserCircle size={28} color="#eee" />
        </div>

        {menuOpen && (
          <div className="navbar__menu">
            <div className="navbar__menu-item">Configuración</div>
            <div className="navbar__menu-item" onClick={handleLogout}>
              Logout
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
