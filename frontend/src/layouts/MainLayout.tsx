import React, { useState, useEffect } from 'react';
import {
  Layout,
  Menu,
  Button,
  theme, // Importar theme
  // Avatar, // Podríamos añadir Avatar más tarde
} from 'antd';
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  HomeOutlined,
  UserOutlined, // Ejemplo
  LogoutOutlined, // Para botón Logout
  ShopOutlined, // Icono para Proveedores
  GoldOutlined, // Icono para Materias Primas
  AppstoreOutlined, // Importar icono para Productos
  SwapOutlined, // Importar icono para Movimientos de Stock
} from '@ant-design/icons';
import { Outlet, useNavigate, Link, useLocation } from 'react-router-dom'; // Importar Outlet, useNavigate, Link, useLocation

const { Header, Sider, Content } = Layout;
const { useToken } = theme; // Hook para acceder a los tokens del tema
// Eliminar Title si no se usa
// const { Title } = Typography;

// Mapeo de rutas a keys del menú
const pathToKeyMap: { [key: string]: string } = {
  '/': '1',
  '/clientes': '2',
  '/suppliers': '3',
  '/raw-materials': '4',
  '/productos': '5', // Añadir mapeo para productos
  '/stock-movements': '6', // Añadir mapeo para movimientos
};

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation(); // Hook para obtener la ubicación actual
  const { token: { colorBgContainer, borderRadiusLG } } = useToken(); // Obtener token
  const [currentKey, setCurrentKey] = useState('1'); // Estado para la key seleccionada

  // Efecto para actualizar la key seleccionada cuando cambia la ruta
  useEffect(() => {
    const key = pathToKeyMap[location.pathname] || '1'; // Encontrar key o default a '1'
    setCurrentKey(key);
  }, [location.pathname]); // Ejecutar cuando cambie el pathname

  const handleLogout = () => {
    localStorage.removeItem('accessToken'); // Limpiar token
    navigate('/login'); // Redirigir a login
    // Podríamos añadir un mensaje de logout exitoso
  };

  // Ítems del menú de navegación
  const menuItems = [
    {
      key: '1',
      icon: <HomeOutlined />,
      label: <Link to="/">Dashboard</Link>,
    },
    {
      key: '2',
      icon: <UserOutlined />,
      label: <Link to="/clientes">Clientes</Link>, // Ruta de ejemplo
    },
    {
      key: '3', // Nueva Key
      icon: <ShopOutlined />,
      label: <Link to="/suppliers">Proveedores</Link>, // Nuevo item
    },
    {
      key: '4', // Nueva Key
      icon: <GoldOutlined />,
      label: <Link to="/raw-materials">Materias Primas</Link>, // Nuevo item
    },
    // Añadir item para Productos
    {
      key: '5', 
      icon: <AppstoreOutlined />, // Usar nuevo icono
      label: <Link to="/productos">Productos</Link>, // Enlace a /productos
    },
    // Añadir item para Movimientos de Stock
    {
      key: '6',
      icon: <SwapOutlined />,
      label: <Link to="/stock-movements">Movimientos Stock</Link>,
    },
    // Añadir más ítems aquí (Inventario, Producción, etc.)
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.3)', textAlign: 'center', lineHeight: '32px', color: 'white', fontWeight: 'bold' }}>
          {collapsed ? 'SC' : 'SystemCalzados'}
        </div>
        <Menu 
          theme="dark" 
          mode="inline" 
          selectedKeys={[currentKey]} // Pasar la key actual
          items={menuItems} 
          // key={Date.now()} // El key={Date.now()} puede no ser necesario ahora
        />
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: colorBgContainer, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            style={{
              fontSize: '16px',
              width: 64,
              height: 64,
            }}
          />
          {/* Podríamos añadir nombre de usuario o avatar aquí */}
          <Button 
            type="text" 
            icon={<LogoutOutlined />} 
            onClick={handleLogout} 
            style={{ marginRight: '16px' }}
          >
            Cerrar Sesión
          </Button>
        </Header>
        <Content
          style={{
            margin: '24px 16px',
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          {/* Aquí se renderizará el contenido de la página protegida actual */}
          <Outlet /> 
        </Content>
        {/* Podríamos añadir un Footer aquí */}
        {/* <Footer style={{ textAlign: 'center' }}>SystemCalzados ©2024</Footer> */}
      </Layout>
    </Layout>
  );
};

export default MainLayout; 