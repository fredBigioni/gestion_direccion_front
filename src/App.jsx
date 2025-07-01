import React from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'

import { MainLayout } from './layouts/MainLayout';
import { HomePage, NotFound } from './pages';
import { Login } from './auth/Login';
import { LoaderData } from './components/loaderData';
import useAuth from './hooks/useAuth';

const PrivateRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <MainLayout>{children}</MainLayout> : <Navigate to="/login" />;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  return !isAuthenticated ? children : <Navigate to="/" />;
};

//Roles
// 1	Admin
// 2	Carga
// 3	Control
// 4	Aprobacion
// 5	Administracion
// 6	Visualizacion

export const App = () => {

  const { auth } = useAuth();

  return (
    <>
      <LoaderData>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
          {/* {auth?.rol.Name.toLowerCase() === 'admin' && (
            <>
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            </>
          )}

          {auth?.rol.Name.toLowerCase() === 'carga' && (
            <>
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            </>
          )}
          {auth?.rol.Name.toLowerCase() === 'control' && (
            <>
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            </>
          )}

          {auth?.rol.Name.toLowerCase() === 'aprobacion' && (
            <>
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            </>
          )}

          {auth?.rol.Name.toLowerCase() === 'administracion' && (
            <>
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            </>
          )}

          {auth?.rol.Name.toLowerCase() === 'visualizacion' && (
            <>
              <Route path="/" element={<PrivateRoute><HomePage /></PrivateRoute>} />
            </>
          )} */}

          <Route path="*" element={<PrivateRoute><NotFound /></PrivateRoute>} />
        </Routes>
      </LoaderData>
    </>
  )
}
