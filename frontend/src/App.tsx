import { Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProtectedRoute from './components/ProtectedRoute';
import MainLayout from './layouts/MainLayout';
import SuppliersPage from './pages/SuppliersPage';
import './App.css'

// Componente simple para la página principal (Dashboard)
const DashboardPage = () => (
  <>
    <p>Bienvenido al Dashboard Principal.</p>
    {/* Contenido específico del dashboard */}
  </>
);

// Componente de ejemplo para Clientes
const ClientesPage = () => (
  <>
    <h2>Gestión de Clientes</h2>
    <p>Aquí iría la tabla o componentes para gestionar clientes.</p>
  </>
);

// Componente placeholder para Materias Primas
const RawMaterialsPage = () => (
  <>
    <h2>Gestión de Materias Primas</h2>
    <p>Contenido de gestión de materias primas irá aquí.</p>
  </>
);

function App() {
  return (
    <Routes>
      {/* Rutas públicas (fuera del layout principal) */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Rutas Protegidas (envueltas por ProtectedRoute y MainLayout) */}
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
           {/* Las páginas específicas se renderizan donde está el <Outlet> en MainLayout */}
          <Route path="/" element={<DashboardPage />} />
          <Route path="/clientes" element={<ClientesPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/raw-materials" element={<RawMaterialsPage />} />
          {/* Añadir más rutas protegidas aquí (ej. /inventario, /produccion) */}
        </Route>
      </Route>

      {/* Ruta para manejar 404 Not Found (Opcional) */}
      {/* <Route path="*" element={<h1>404 - Página no encontrada</h1>} /> */}

    </Routes>
  );
}

export default App;
