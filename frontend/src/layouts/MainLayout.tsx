import React, { useState } from 'react';
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
} from '@ant-design/icons';
import { Outlet, useNavigate, Link } from 'react-router-dom'; // Importar Outlet, useNavigate, Link

const { Header, Sider, Content } = Layout;
const { useToken } = theme; // Hook para acceder a los tokens del tema
// Eliminar Title si no se usa
// const { Title } = Typography;

const MainLayout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const { token: { colorBgContainer, borderRadiusLG } } = useToken(); // Obtener token

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
    // Añadir más ítems aquí (Inventario, Producción, etc.)
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed}>
        <div style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.3)', textAlign: 'center', lineHeight: '32px', color: 'white', fontWeight: 'bold' }}>
          {collapsed ? 'SC' : 'SystemCalzados'}
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={['1']} items={menuItems} />
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