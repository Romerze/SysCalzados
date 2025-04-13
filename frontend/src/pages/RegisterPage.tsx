import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { RegisterFormValues } from '../types/formTypes';
import { registerUser } from '../services/api';
import axios from 'axios';

const { Title } = Typography;

const RegisterPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values: RegisterFormValues) => {
    const { email, password } = values;
    setLoading(true);
    message.loading({ content: 'Registrando...', key: 'register' });
    try {
      const response = await registerUser({ email, password });
      message.success({ content: '¡Registro exitoso! Ahora puedes iniciar sesión.', key: 'register', duration: 3 });
      console.log('Register Response:', response);
      navigate('/login');
    } catch (error: unknown) {
      console.error('Register Error:', error);
      let errorMessage = 'Error en el registro. Inténtalo de nuevo.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      message.error({ content: errorMessage, key: 'register', duration: 4 });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <Card style={{ width: 400 }}>
        <Title level={2} style={{ textAlign: 'center', marginBottom: '24px' }}>Registro</Title>
        <Form
          name="register"
          onFinish={onFinish}
          scrollToFirstError
        >
          <Form.Item
            name="email"
            rules={[
              { required: true, message: 'Por favor ingresa tu correo electrónico!' },
              { type: 'email', message: 'El correo electrónico no es válido!' },
            ]}
          >
            <Input prefix={<MailOutlined />} placeholder="Correo Electrónico" disabled={loading} />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[
              { required: true, message: 'Por favor ingresa tu contraseña!' },
              { min: 8, message: 'La contraseña debe tener al menos 8 caracteres' },
            ]}
            hasFeedback
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Contraseña" disabled={loading} />
          </Form.Item>

          <Form.Item
            name="confirm"
            dependencies={['password']}
            hasFeedback
            rules={[
              { required: true, message: 'Por favor confirma tu contraseña!' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Las contraseñas no coinciden!'));
                },
              }),
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="Confirmar Contraseña" disabled={loading} />
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" style={{ width: '100%' }} loading={loading}>
              Registrar
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage; 