import React, { useState, useEffect, useRef, KeyboardEvent, ChangeEvent } from 'react';
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
  InputRef,
} from 'antd';
import type { ColumnType, ColumnsType } from 'antd/es/table';
import type { FilterConfirmProps, FilterDropdownProps } from 'antd/es/table/interface';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  SearchOutlined,
} from '@ant-design/icons';
// Importar tipo Client y funciones API
import { Client } from '../types/models';
import { getClients, deleteClient, createClient, updateClient } from '../services/api';
import axios from 'axios';
import Highlighter from 'react-highlight-words';

const { Title } = Typography;

type DataIndex = keyof Client; // Usar Client como base para DataIndex

const ClientsPage: React.FC = () => {
  const [clients, setClients] = useState<Client[]>([]); // Estado para clientes
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null); // Estado para cliente en edición
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingClient, setViewingClient] = useState<Client | null>(null); // Estado para cliente en visualización
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);

  const [form] = Form.useForm();

  // --- Funciones de Búsqueda/Filtro (igual que en SuppliersPage) ---
  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: DataIndex,
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex);
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  const getColumnSearchProps = (dataIndex: DataIndex): ColumnType<Client> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Buscar por ${dataIndex}`}
          value={selectedKeys[0]}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, dataIndex)}
            icon={<SearchOutlined />}
            size="small"
            style={{ width: 90 }}
          >
            Buscar
          </Button>
          <Button
            onClick={() => clearFilters && handleReset(clearFilters)}
            size="small"
            style={{ width: 90 }}
          >
            Resetear
          </Button>
          <Button
            type="link"
            size="small"
            onClick={() => close()}
          >
            Cerrar
          </Button>
        </Space>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
    onFilter: (value, record) => {
        const recordValue = record[dataIndex];
        return recordValue != null &&
               recordValue.toString().toLowerCase().includes((value as string).toLowerCase());
    },      
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) =>
      searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={text ? text.toString() : ''}
        />
      ) : (
        text
      ),
  });
  // --- Fin Funciones de Búsqueda/Filtro ---

  const fetchClients = async () => {
    setLoading(true);
    try {
      const data = await getClients(); // Usar getClients
      setClients(data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      message.error('Error al cargar los clientes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleAdd = () => {
    setEditingClient(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (client: Client) => {
    setEditingClient(client);
    form.setFieldsValue(client);
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setEditingClient(null);
    form.resetFields();
  };

  const handleDelete = async (id: number) => {
    message.loading({ content: 'Eliminando...', key: `delete-${id}` });
    try {
      await deleteClient(id); // Usar deleteClient
      message.success({ content: 'Cliente eliminado', key: `delete-${id}`, duration: 2 });
      fetchClients(); // Recargar datos
    } catch (error) {
      console.error('Error deleting client:', error);
      message.error({ content: 'Error al eliminar el cliente', key: `delete-${id}`, duration: 3 });
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      const payload = { ...values };
      const actionKey = editingClient ? 'update' : 'create';
      message.loading({ content: editingClient ? 'Actualizando...' : 'Creando...', key: actionKey });

      if (editingClient) {
        await updateClient(editingClient.id, payload); // Usar updateClient
        message.success({ content: 'Cliente actualizado', key: actionKey, duration: 2 });
      } else {
        await createClient(payload); // Usar createClient
        message.success({ content: 'Cliente creado', key: actionKey, duration: 2 });
      }
      setIsModalVisible(false);
      setEditingClient(null);
      form.resetFields();
      fetchClients(); // Recargar datos

    } catch (error: unknown) {
      console.error('Form submission error:', error);
      let errorMessage = editingClient ? 'Error al actualizar' : 'Error al crear';
      
      // Verificar si es un error de Axios con respuesta y datos
      if (axios.isAxiosError(error) && error.response?.data) {
        // Comprobar si es un error de conflicto (409)
        if (error.response.status === 409 && error.response.data.message) {
          errorMessage = error.response.data.message; // Usar mensaje del backend (e.g., "El DNI ya existe")
        } else if (error.response.data.message) {
          // Podría ser otro error del backend con mensaje (e.g., 400 Bad Request con detalles)
          // Si el mensaje es un array (común en errores de validación de class-validator), unirlo.
          if (Array.isArray(error.response.data.message)) {
            errorMessage = error.response.data.message.join(', ');
          } else {
             errorMessage = error.response.data.message;
          }
        }
      // Comprobar si es un error de validación del formulario Ant Design (no de Axios)
      } else if (typeof error === 'object' && error !== null && 'errorFields' in error) { 
        errorMessage = 'Error en el formulario. Revisa los campos.';
      // Otro tipo de error (e.g., error de red, error genérico)
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      message.error({ content: `Error: ${errorMessage}`, key: editingClient ? 'update' : 'create', duration: 5 }); // Aumentar duración para mensajes largos
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleView = (client: Client) => {
    setViewingClient(client);
    setIsViewModalVisible(true);
  };

  const handleCancelViewModal = () => {
    setIsViewModalVisible(false);
    setViewingClient(null);
  };

  // Definición de columnas para la tabla de Clientes
  const columns: ColumnsType<Client> = [
    { 
      title: 'Nombre', 
      dataIndex: 'firstName', 
      key: 'firstName', 
      sorter: (a: Client, b: Client) => a.firstName.localeCompare(b.firstName),
      ...getColumnSearchProps('firstName') 
    },
    { 
      title: 'Apellido', 
      dataIndex: 'lastName', 
      key: 'lastName', 
      sorter: (a: Client, b: Client) => a.lastName.localeCompare(b.lastName),
      ...getColumnSearchProps('lastName') 
    },
    { 
      title: 'DNI', 
      dataIndex: 'dni', 
      key: 'dni',
      ...getColumnSearchProps('dni') 
    },
    { 
      title: 'Teléfono', 
      dataIndex: 'phone', 
      key: 'phone',
      ...getColumnSearchProps('phone') 
    },
    { 
      title: 'Email', 
      dataIndex: 'email', 
      key: 'email',
      ...getColumnSearchProps('email') 
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (text: unknown, record: Client) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="¿Estás seguro de eliminar este cliente?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button type="link" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={2}>Gestión de Clientes</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Nuevo Cliente
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={clients} 
        rowKey="id" 
        loading={loading} 
        bordered
      />
      {/* --- Modal Crear/Editar Cliente --- */}
      <Modal
        title={editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
        visible={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleCancelModal}
        confirmLoading={isSubmitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="clientForm">
          <Form.Item
            name="firstName"
            label="Nombre"
            rules={[{ required: true, message: 'El nombre es requerido' }, { min: 3, message: 'Mínimo 3 caracteres'}] }
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="lastName"
            label="Apellido"
            rules={[{ required: true, message: 'El apellido es requerido' }, { min: 3, message: 'Mínimo 3 caracteres'}] }
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="dni"
            label="DNI"
            rules={[{ required: true, message: 'El DNI es requerido' }, { len: 8, message: 'El DNI debe tener 8 dígitos'}, { pattern: /^[0-9]+$/, message: 'Solo números'}] }
          >
            <Input maxLength={8}/>
          </Form.Item>
          <Form.Item
            name="phone"
            label="Teléfono"
            // Añadir patrón si se quiere validar formato específico
            // rules={[{ pattern: /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s\./0-9]*$/, message: 'Número inválido'}] }
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

      {/* --- Modal Ver Detalles Cliente --- */}
      {viewingClient && (
        <Modal
          title={`Detalles del Cliente: ${viewingClient.firstName} ${viewingClient.lastName}`}
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
            <Form.Item label="Nombre">
              <Input value={viewingClient.firstName} disabled />
            </Form.Item>
            <Form.Item label="Apellido">
              <Input value={viewingClient.lastName} disabled />
            </Form.Item>
             <Form.Item label="DNI">
              <Input value={viewingClient.dni} disabled />
            </Form.Item>
            <Form.Item label="Teléfono">
              <Input value={viewingClient.phone || '-'} disabled />
            </Form.Item>
            <Form.Item label="Correo Electrónico">
              <Input value={viewingClient.email || '-'} disabled />
            </Form.Item>
            <Form.Item label="Dirección">
              <Input.TextArea value={viewingClient.address || '-'} rows={3} disabled />
            </Form.Item>
            {/* Mostrar fechas si se añaden al modelo 
            <Form.Item label="Creado">
              <Input value={viewingClient.createdAt ? new Date(viewingClient.createdAt).toLocaleString() : '-'} disabled />
            </Form.Item>
            <Form.Item label="Actualizado">
              <Input value={viewingClient.updatedAt ? new Date(viewingClient.updatedAt).toLocaleString() : '-'} disabled />
            </Form.Item>
            */}
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default ClientsPage; 