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
  Select,
  InputNumber,
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { RawMaterial, Supplier } from '../types/models';
import {
  getRawMaterials,
  deleteRawMaterial,
  createRawMaterial,
  updateRawMaterial,
  getSuppliers,
} from '../services/api';
import axios from 'axios';

const { Title } = Typography;
const { Option } = Select;

const RawMaterialsPage: React.FC = () => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [materialsData, suppliersData] = await Promise.all([
        getRawMaterials(),
        getSuppliers(),
      ]);
      setRawMaterials(materialsData);
      setSuppliers(suppliersData);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAdd = () => {
    setEditingMaterial(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (material: RawMaterial) => {
    setEditingMaterial(material);
    form.setFieldsValue({ ...material, supplierId: material.supplier?.id });
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setEditingMaterial(null);
    form.resetFields();
  };

  const handleDelete = async (id: number) => {
    message.loading({ content: 'Eliminando...', key: `delete-${id}` });
    try {
      await deleteRawMaterial(id);
      message.success({ content: 'Materia prima eliminada', key: `delete-${id}`, duration: 2 });
      fetchData();
    } catch (error) {
      console.error('Error deleting material:', error);
      message.error({ content: 'Error al eliminar', key: `delete-${id}`, duration: 3 });
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      const payload = { ...values };
      const actionKey = editingMaterial ? 'update' : 'create';
      message.loading({ content: editingMaterial ? 'Actualizando...' : 'Creando...', key: actionKey });

      if (editingMaterial) {
        await updateRawMaterial(editingMaterial.id, payload);
        message.success({ content: 'Materia prima actualizada', key: actionKey, duration: 2 });
      } else {
        await createRawMaterial(payload);
        message.success({ content: 'Materia prima creada', key: actionKey, duration: 2 });
      }
      setIsModalVisible(false);
      setEditingMaterial(null);
      form.resetFields();
      fetchData();

    } catch (error: unknown) {
      console.error('Form submission error:', error);
      let errorMessage = editingMaterial ? 'Error al actualizar' : 'Error al crear';
      
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error instanceof Error) {
        if (typeof error === 'object' && error !== null && Object.prototype.hasOwnProperty.call(error, 'errorFields')) {
          errorMessage = 'Error en el formulario. Revisa los campos.';
        } else {
          errorMessage = error.message;
        }
      }
      message.error({ content: `Error: ${errorMessage}`, key: editingMaterial ? 'update' : 'create', duration: 4 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    { title: 'Nombre', dataIndex: 'name', key: 'name', sorter: (a: RawMaterial, b: RawMaterial) => a.name.localeCompare(b.name) },
    { title: 'Descripción', dataIndex: 'description', key: 'description' },
    { title: 'Unidad', dataIndex: 'unit', key: 'unit' },
    { title: 'Stock', dataIndex: 'stock', key: 'stock', sorter: (a: RawMaterial, b: RawMaterial) => a.stock - b.stock },
    {
      title: 'Proveedor',
      dataIndex: 'supplierId',
      key: 'supplier',
      render: (supplierId: number) => {
        const supplier = suppliers.find(s => s.id === supplierId);
        return supplier ? supplier.name : '-';
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (text: unknown, record: RawMaterial) => (
        <Space size="middle">
          <Button icon={<EditOutlined />} onClick={() => handleEdit(record)}>Editar</Button>
          <Popconfirm
            title="¿Estás seguro de eliminar esta materia prima?"
            onConfirm={() => handleDelete(record.id)}
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
        <Title level={2}>Gestión de Materias Primas</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Nueva Materia Prima
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={rawMaterials} 
        rowKey="id" 
        loading={loading} 
        bordered 
      />
      <Modal
        title={editingMaterial ? 'Editar Materia Prima' : 'Nueva Materia Prima'}
        visible={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleCancelModal}
        confirmLoading={isSubmitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="rawMaterialForm">
          <Form.Item
            name="name"
            label="Nombre"
            rules={[{ required: true, message: 'El nombre es requerido' }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="description"
            label="Descripción"
          >
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="unit"
            label="Unidad de Medida"
            rules={[{ required: true, message: 'La unidad es requerida' }]}
          >
            <Input placeholder="Ej: metros, pares, kg, unidades" />
          </Form.Item>
          <Form.Item
            name="stock"
            label="Stock Inicial"
            rules={[{ type: 'number', min: 0, message: 'Debe ser 0 o mayor' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} defaultValue={0}/>
          </Form.Item>
          <Form.Item
            name="supplierId"
            label="Proveedor Principal (Opcional)"
          >
            <Select allowClear placeholder="Selecciona un proveedor">
              {suppliers.map(supplier => (
                <Option key={supplier.id} value={supplier.id}>
                  {supplier.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default RawMaterialsPage; 