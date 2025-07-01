// src/layouts/MainLayout.jsx
import React from 'react';
import { Navbar } from '../components';
import './mainLayout.css';

export const MainLayout = ({ children }) => {
    return (
        <div className="main-layout">
          <Navbar />
          <div className="main-layout__content">
            <div className="main-layout__box">
              {children}
            </div>
          </div>
        </div>
      );
};
