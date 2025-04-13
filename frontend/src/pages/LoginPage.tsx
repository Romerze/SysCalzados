import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { LoginFormValues } from '../types/formTypes';
import { loginUser } from '../services/api';
import axios from 'axios';

const { Title } = Typography;

const LoginPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: LoginFormValues) => {
    setLoading(true);
    message.loading({ content: 'Iniciando sesión...', key: 'login' });
    try {
      const response = await loginUser(values);
      message.success({ content: '¡Inicio de sesión exitoso!', key: 'login', duration: 2 });
      console.log('Login Response:', response);
      localStorage.setItem('accessToken', response.access_token);
      navigate('/');
    } catch (error: unknown) {
      console.error('Login Error:', error);
      let errorMessage = 'Error al iniciar sesión. Inténtalo de nuevo.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      message.error({ content: errorMessage, key: 'login', duration: 4 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card style={{ width: 400 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>Iniciar Sesión</Title>
        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
        >
          <Form.Item
            name="email"
            rules={[{ required: true, type: 'email', message: 'Por favor ingresa un correo válido!' }]}
          >
            <Input prefix={<MailOutlined />} placeholder="Correo Electrónico" disabled={loading} />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: 'Por favor ingresa tu contraseña!' }]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" disabled={loading} />
          </Form.Item>

          {/* Podríamos añadir "Recordarme" o "¿Olvidaste tu contraseña?" aquí */}

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              Ingresar
            </Button>
          </Form.Item>
          
          {/* Podríamos añadir un enlace a la página de registro aquí */}
          {/* Ej: O <a href="/register">¡Regístrate ahora!</a> */}
        </Form>
      </Card>
    </div>
  );
};

export default LoginPage; 