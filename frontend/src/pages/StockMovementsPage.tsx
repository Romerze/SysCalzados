import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Table,
  message,
  Modal,
  Form,
  Select,
  Radio,
  InputNumber,
  Input,
  Tag, // Para mostrar tipo de movimiento
} from 'antd';
import {
  PlusOutlined,
  ArrowUpOutlined, // Icono Entrada
  ArrowDownOutlined, // Icono Salida
} from '@ant-design/icons';
import { StockMovement, MovementType, RawMaterial } from '../types/models';
import { getStockMovements, createStockMovement, getRawMaterials } from '../services/api';
import axios from 'axios';
import { format } from 'date-fns'; // Para formatear fechas

const { Title } = Typography;

const StockMovementsPage: React.FC = () => {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form] = Form.useForm();

  const fetchData = async () => {
    setLoading(true);
    try {
      const [movementsData, rawMaterialsData] = await Promise.all([
        getStockMovements(),
        getRawMaterials(),
      ]);
      setMovements(movementsData);
      setRawMaterials(rawMaterialsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Error al cargar los movimientos de stock');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddMovement = () => {
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleModalSubmit = async () => {
    try {
      const values = await form.validateFields();
      setIsSubmitting(true);
      const payload = {
        ...values,
        quantity: Number(values.quantity), // Asegurar que sea número
      };
      const actionKey = 'create-movement';
      message.loading({ content: 'Registrando movimiento...', key: actionKey });

      await createStockMovement(payload);
      message.success({ content: 'Movimiento registrado exitosamente', key: actionKey, duration: 2 });
      
      setIsModalVisible(false);
      form.resetFields();
      fetchData(); // Recargar movimientos y materias primas (para stock actualizado)

    } catch (error: unknown) {
      console.error('Stock movement submission error:', error);
      let errorMessage = 'Error al registrar el movimiento';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        // Si el backend envía un mensaje (ej. Stock insuficiente)
        errorMessage = error.response.data.message;
      } else if (typeof error === 'object' && error !== null && 'errorFields' in error) { 
        errorMessage = 'Error en el formulario. Revisa los campos.';
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      message.error({ content: `Error: ${errorMessage}`, key: 'create-movement', duration: 5 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const columns = [
    {
      title: 'Fecha',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => format(new Date(date), 'dd/MM/yyyy HH:mm'), // Formatear fecha
      sorter: (a: StockMovement, b: StockMovement) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      defaultSortOrder: 'descend' as const,
    },
    {
      title: 'Materia Prima',
      dataIndex: ['rawMaterial', 'name'], // Acceder al nombre anidado
      key: 'rawMaterialName',
      render: (name: string, record: StockMovement) => (
          <>{name} <span style={{color: 'gray'}}>({record.rawMaterial?.unit})</span></>
      )
    },
    {
      title: 'Tipo',
      dataIndex: 'type',
      key: 'type',
      render: (type: MovementType) => (
        <Tag 
          color={type === MovementType.ENTRY ? 'green' : 'red'} 
          icon={type === MovementType.ENTRY ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
        >
          {type === MovementType.ENTRY ? 'Entrada' : 'Salida'}
        </Tag>
      ),
      filters: [
        { text: 'Entrada', value: MovementType.ENTRY },
        { text: 'Salida', value: MovementType.EXIT },
      ],
      onFilter: (value: string | number | boolean, record: StockMovement) => record.type === value,
    },
    {
      title: 'Cantidad',
      dataIndex: 'quantity',
      key: 'quantity',
      align: 'right' as const,
      render: (qty: number, record: StockMovement) => (
          <span style={{color: record.type === MovementType.ENTRY ? 'green' : 'red'}}>
            {record.type === MovementType.ENTRY ? '+' : '-'}{Number(qty).toFixed(2)}
          </span>
      )
    },
    {
      title: 'Stock Resultante',
      dataIndex: 'stockAfterMovement',
      key: 'stockAfterMovement',
      // Podríamos añadir renderizado si queremos formato específico (ej. decimales)
      render: (stock: number | undefined) => stock !== undefined ? Number(stock).toFixed(2) : '-',
    },
    {
      title: 'Notas',
      dataIndex: 'notes',
      key: 'notes',
      ellipsis: true, // Acortar notas largas
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <Title level={2}>Historial de Movimientos de Stock (Materias Primas)</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAddMovement}>
          Nuevo Movimiento
        </Button>
      </div>
      <Table 
        columns={columns} 
        dataSource={movements} 
        rowKey="id" 
        loading={loading} 
        bordered
        pagination={{ pageSize: 15 }}
      />
      <Modal
        title="Registrar Nuevo Movimiento de Stock"
        open={isModalVisible}
        onOk={handleModalSubmit}
        onCancel={handleCancelModal}
        confirmLoading={isSubmitting}
        destroyOnClose
      >
        <Form form={form} layout="vertical" name="stockMovementForm">
          <Form.Item
            name="rawMaterialId"
            label="Materia Prima"
            rules={[{ required: true, message: 'Selecciona una materia prima' }]}
          >
            <Select
              showSearch
              placeholder="Busca o selecciona una materia prima"
              loading={loading}
              filterOption={(input: string, option?: { label?: string; value?: number }) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={rawMaterials.map(rm => ({
                value: rm.id,
                label: `${rm.name} (Stock: ${rm.stock} ${rm.unit})`
              }))}
            >
            </Select>
          </Form.Item>
          <Form.Item
            name="type"
            label="Tipo de Movimiento"
            rules={[{ required: true, message: 'Selecciona el tipo' }]}
          >
             <Radio.Group>
                <Radio value={MovementType.ENTRY}> <ArrowUpOutlined style={{color:'green'}}/> Entrada </Radio>
                <Radio value={MovementType.EXIT}> <ArrowDownOutlined style={{color:'red'}}/> Salida </Radio>
            </Radio.Group>
          </Form.Item>
          <Form.Item
            name="quantity"
            label="Cantidad"
            rules={[{ required: true, message: 'Ingresa la cantidad'}, {type: 'number', min: 0.01, message: 'Debe ser mayor a 0'}] }
          >
            <InputNumber min={0.01} precision={2} style={{ width: '100%' }}/>
          </Form.Item>
           <Form.Item
            name="notes"
            label="Notas (Opcional)"
          >
            <Input.TextArea rows={2} placeholder="Ej: Compra Factura #123, Uso en Orden #456" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default StockMovementsPage; 