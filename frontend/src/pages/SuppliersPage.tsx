import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Space,
  Table,
  message,
  Popconfirm,
  Modal,
  Form,
  Input,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
} from '@ant-design/icons';
import { Supplier } from '../types/models';
import { getSuppliers, deleteSupplier, createSupplier, updateSupplier } from '../services/api';
import axios from 'axios';

const { Title } = Typography;

const SuppliersPage: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  const [form] = Form.useForm();

  const fetchSuppliers = async () => {
    setLoading(true);
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
      message.error('Error al cargar los proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSuppliers();
  }, []);

  const handleAddSupplier = () => {
    setEditingSupplier(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEditSupplier = (supplier: Supplier) => {
    setEditingSupplier(supplier);
    form.setFieldsValue(supplier);
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setEditingSupplier(null);
    form.resetFields();
  };

  const handleDeleteSupplier = async (id: number) => {
    message.loading({ content: 'Eliminando...', key: `delete-${id}` });
    try {
      await deleteSupplier(id);
      message.success({ content: 'Proveedor eliminado', key: `delete-${id}`, duration: 2 });
      fetchSuppliers();
    } catch (error) {
      console.error('Error deleting supplier:', error);
      message.error({ content: 'Error al eliminar el proveedor', key: `delete-${id}`, duration: 3 });
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      const payload = { ...values };
      const actionKey = editingSupplier ? 'update' : 'create';
      message.loading({ content: editingSupplier ? 'Actualizando...' : 'Creando...', key: actionKey });

      if (editingSupplier) {
        await updateSupplier(editingSupplier.id, payload);
        message.success({ content: 'Proveedor actualizado', key: actionKey, duration: 2 });
      } else {
        await createSupplier(payload);
        message.success({ content: 'Proveedor creado', key: actionKey, duration: 2 });
      }
      setIsModalVisible(false);
      setEditingSupplier(null);
      form.resetFields();
      fetchSuppliers();

    } catch (error: unknown) {
      console.error('Form submission error:', error);
      let errorMessage = editingSupplier ? 'Error al actualizar' : 'Error al crear';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        if (!axios.isAxiosError(error)) {
          errorMessage = 'Error en el formulario. Revisa los campos.';
        }
      }
      message.error({ content: `Error: ${errorMessage}`, key: editingSupplier ? 'update' : 'create', duration: 4 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewSupplier = (supplier: Supplier) => {
    setViewingSupplier(supplier);
    setIsViewModalVisible(true);
  };

  const handleCancelViewModal = () => {
    setIsViewModalVisible(false);
    setViewingSupplier(null);
  };

  const columns = [
    /*
    { 
      title: 'ID', 
      dataIndex: 'id', 
      key: 'id', 
      sorter: (a: Supplier, b: Supplier) => a.id - b.id 
    },
    */
    { title: 'Nombre', dataIndex: 'name', key: 'name', sorter: (a: Supplier, b: Supplier) => a.name.localeCompare(b.name) },
    { title: 'Contacto', dataIndex: 'contactPerson', key: 'contactPerson' },
    { title: 'Teléfono', dataIndex: 'phone', key: 'phone' },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Acciones',
      key: 'actions',
      render: (text: unknown, record: Supplier) => (
        <Space size="middle">
          <Button icon={<EyeOutlined />} onClick={() => handleViewSupplier(record)}>Ver</Button>
          <Button icon={<EditOutlined />} onClick={() => handleEditSupplier(record)}>Editar</Button>
          <Popconfirm
            title="¿Estás seguro de eliminar este proveedor?"
            onConfirm={() => handleDeleteSupplier(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button danger icon={<DeleteOutlined />}>Eliminar</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={2}>Gestión de Proveedores</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddSupplier}>
          Nuevo Proveedor
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={suppliers} 
        rowKey="id" 
        loading={loading} 
        bordered
      />
      <Modal
        title={editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
        visible={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleCancelModal}
        confirmLoading={isSubmitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="supplierForm">
          <Form.Item
            name="name"
            label="Nombre"
            rules={[{ required: true, message: 'El nombre es requerido' }, { min: 3, message: 'Mínimo 3 caracteres'}] }
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="contactPerson"
            label="Persona de Contacto"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="phone"
            label="Teléfono"
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="email"
            label="Correo Electrónico"
            rules={[{ type: 'email', message: 'Debe ser un correo válido' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="address"
            label="Dirección"
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      {/* --- Modal Ver Detalles --- */}
      {viewingSupplier && ( 
        <Modal
          title={`Detalles del Proveedor: ${viewingSupplier.name}`}
          visible={isViewModalVisible}
          onCancel={handleCancelViewModal}
          footer={[
            <Button key="close" onClick={handleCancelViewModal}>
              Cerrar
            </Button>,
          ]}
          destroyOnClose
        >
          <Form layout="vertical">
            {/* Eliminar o comentar el Form.Item para el ID */}
            {/* 
            <Form.Item label="ID">
              <Input value={viewingSupplier.id} disabled />
            </Form.Item>
            */}
            <Form.Item label="Nombre">
              <Input value={viewingSupplier.name} disabled />
            </Form.Item>
            <Form.Item label="Persona de Contacto">
              <Input value={viewingSupplier.contactPerson || '-'} disabled />
            </Form.Item>
            <Form.Item label="Teléfono">
              <Input value={viewingSupplier.phone || '-'} disabled />
            </Form.Item>
            <Form.Item label="Correo Electrónico">
              <Input value={viewingSupplier.email || '-'} disabled />
            </Form.Item>
            <Form.Item label="Dirección">
              <Input.TextArea value={viewingSupplier.address || '-'} rows={3} disabled />
            </Form.Item>
            {/* Añadir otros campos si existen (createdAt, etc.) */}
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default SuppliersPage; 