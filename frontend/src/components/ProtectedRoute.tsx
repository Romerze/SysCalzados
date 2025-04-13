import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

// No se necesitan props por ahora
// interface ProtectedRouteProps {}

const ProtectedRoute: React.FC = () => {
  // Lógica simple para verificar si el token existe en localStorage
  const token = localStorage.getItem('accessToken');

  // TODO: Añadir verificación de la validez/expiración del token aquí
  // Podríamos usar una librería como jwt-decode para inspeccionar el token

  if (!token) {
    // Si no hay token, redirigir a la página de login
    // El prop `replace` evita que el usuario pueda volver a la página protegida con el botón "atrás"
    return <Navigate to="/login" replace />;
  }

  // Si hay token, renderizar el contenido de la ruta (usando Outlet)
  return <Outlet />;
};

export default ProtectedRoute; 