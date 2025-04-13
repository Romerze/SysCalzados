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
  Select,
  InputNumber,
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
import { RawMaterial, Supplier } from '../types/models';
import {
  getRawMaterials,
  deleteRawMaterial,
  createRawMaterial,
  updateRawMaterial,
  getSuppliers,
} from '../services/api';
import axios from 'axios';
import Highlighter from 'react-highlight-words';

const { Title } = Typography;

type DataIndex = keyof RawMaterial | 'supplier';

const RawMaterialsPage: React.FC = () => {
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<RawMaterial | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingMaterial, setViewingMaterial] = useState<RawMaterial | null>(null);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);

  const [form] = Form.useForm();

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

  const getColumnSearchProps = (dataIndex: DataIndex): ColumnType<RawMaterial> => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Buscar ${dataIndex === 'supplier' ? 'Proveedor' : dataIndex}`}
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
      let recordValue;
      if (dataIndex === 'supplier') {
        const supplier = suppliers.find(s => s.id === record.supplierId);
        recordValue = supplier ? supplier.name : '';
      } else {
        recordValue = record[dataIndex as keyof RawMaterial];
      }
      return recordValue != null &&
             recordValue.toString().toLowerCase().includes((value as string).toLowerCase());
    },
    onFilterDropdownOpenChange: (visible) => {
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text, record) => {
      const currentText = dataIndex === 'supplier' 
        ? (suppliers.find(s => s.id === record.supplierId)?.name || '-') 
        : text;
      return searchedColumn === dataIndex ? (
        <Highlighter
          highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
          searchWords={[searchText]}
          autoEscape
          textToHighlight={currentText ? currentText.toString() : ''}
        />
      ) : (
        currentText
      );
    },
  });

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
      const payload = { ...values, supplierId: values.supplierId || null };
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
      } else if (typeof error === 'object' && error !== null && 'errorFields' in error) {
        errorMessage = 'Error en el formulario. Revisa los campos.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      message.error({ content: `Error: ${errorMessage}`, key: editingMaterial ? 'update' : 'create', duration: 4 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewMaterial = (material: RawMaterial) => {
    setViewingMaterial(material);
    setIsViewModalVisible(true);
  };

  const handleCancelViewModal = () => {
    setIsViewModalVisible(false);
    setViewingMaterial(null);
  };

  const supplierOptions = suppliers.map(supplier => ({
    value: supplier.id,
    label: supplier.name,
  }));

  const columns: ColumnsType<RawMaterial> = [
    { 
      title: 'Nombre', 
      dataIndex: 'name', 
      key: 'name', 
      sorter: (a: RawMaterial, b: RawMaterial) => a.name.localeCompare(b.name),
      ...getColumnSearchProps('name')
    },
    { 
      title: 'Descripción', 
      dataIndex: 'description', 
      key: 'description',
      ...getColumnSearchProps('description')
    },
    { 
      title: 'Unidad', 
      dataIndex: 'unit', 
      key: 'unit',
      ...getColumnSearchProps('unit')
    },
    { 
      title: 'Stock', 
      dataIndex: 'stock', 
      key: 'stock', 
      sorter: (a: RawMaterial, b: RawMaterial) => a.stock - b.stock 
    },
    {
      title: 'Proveedor',
      dataIndex: 'supplierId',
      key: 'supplier',
      ...getColumnSearchProps('supplier'),
      filters: suppliers.map(s => ({ text: s.name, value: s.id })),
      onFilter: (value, record) => record.supplierId === value,
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (text: unknown, record: RawMaterial) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleViewMaterial(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="¿Estás seguro de eliminar esta materia prima?"
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
            label="Stock Actual"
            rules={[{ required: true, message: 'Stock es requerido'}, { type: 'number', min: 0, message: 'Debe ser 0 o mayor' }]}
          >
            <InputNumber style={{ width: '100%' }} min={0} />
          </Form.Item>
          <Form.Item
            name="supplierId"
            label="Proveedor Principal"
          >
            <Select 
              allowClear 
              showSearch
              placeholder="Selecciona o busca un proveedor"
              optionFilterProp="label"
              options={supplierOptions}
              loading={loading}
              disabled={loading}
              filterOption={(input: string, option?: { label: string; value: number }) => 
                (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
            />
          </Form.Item>
        </Form>
      </Modal>
      {viewingMaterial && (
        <Modal
          title={`Detalles de Materia Prima: ${viewingMaterial.name}`}
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
              <Input value={viewingMaterial.name} disabled />
            </Form.Item>
            <Form.Item label="Descripción">
              <Input.TextArea value={viewingMaterial.description || '-'} rows={2} disabled />
            </Form.Item>
            <Form.Item label="Unidad de Medida">
              <Input value={viewingMaterial.unit} disabled />
            </Form.Item>
            <Form.Item label="Stock Actual">
              <InputNumber value={viewingMaterial.stock} style={{ width: '100%' }} disabled />
            </Form.Item>
            <Form.Item label="Proveedor Principal">
              <Input value={suppliers.find(s => s.id === viewingMaterial.supplierId)?.name || 'No asignado'} disabled />
            </Form.Item>
          </Form>
        </Modal>
      )}
    </div>
  );
};

export default RawMaterialsPage; 