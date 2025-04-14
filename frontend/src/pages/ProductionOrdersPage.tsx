import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Space,
  Table,
  message,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Tag,
  Popconfirm,
  Alert,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  PlusOutlined,
  DeleteOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
} from '@ant-design/icons';
import {
  ProductionOrder,
  ProductionOrderStatus,
  Product,
  RawMaterial,
} from '../types/models';
import {
  getProductionOrders,
  createProductionOrder,
  updateProductionOrder,
  deleteProductionOrder,
  getProducts, // Para seleccionar producto al crear
  getRawMaterials,
  getOneProduct,
} from '../services/api';
import { format } from 'date-fns'; // Para formatear fechas
import axios from 'axios';

const { Title } = Typography;

// Helper para mapear estado a color de Tag
const getStatusColor = (status: ProductionOrderStatus) => {
  switch (status) {
    case ProductionOrderStatus.PENDING:
      return 'gold';
    case ProductionOrderStatus.IN_PROGRESS:
      return 'processing';
    case ProductionOrderStatus.COMPLETED:
      return 'success';
    case ProductionOrderStatus.CANCELLED:
      return 'error';
    default:
      return 'default';
  }
};

const ProductionOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [availableRawMaterials, setAvailableRawMaterials] = useState<RawMaterial[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // --- Nuevos estados para verificación de stock --- 
  const [selectedProductDetails, setSelectedProductDetails] = useState<Product | null>(null);
  const [quantityToProduceInput, setQuantityToProduceInput] = useState<number | null>(null);
  const [stockCheckResult, setStockCheckResult] = useState<{ status: 'idle' | 'ok' | 'insufficient' | 'loading' | 'error', message?: string, missing?: { name: string, required: number, available: number, unit: string }[] }>({ status: 'idle' });

  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();

  // --- Fetch Data (asegurarse que carga stock de RawMaterial) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, productsData, rawMaterialsData] = await Promise.all([
        getProductionOrders(),
        getProducts(), 
        getRawMaterials(),
      ]);
      setOrders(ordersData);
      setProducts(productsData.filter(p => p.composition && p.composition.length > 0)); 
      setAvailableRawMaterials(rawMaterialsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers --- 
  const handleAdd = () => {
    form.resetFields();
    setSelectedProductDetails(null); // Resetear detalles
    setQuantityToProduceInput(null); // Resetear cantidad
    setStockCheckResult({ status: 'idle' }); // Resetear verificación
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setSelectedProductDetails(null);
    setQuantityToProduceInput(null);
    setStockCheckResult({ status: 'idle' });
  };

  // Handler cuando cambia el producto seleccionado
  const handleProductChange = async (productId: number | null) => {
    setSelectedProductDetails(null); // Limpiar detalles anteriores
    setStockCheckResult({ status: 'idle' }); // Resetear verificación
    if (productId) {
      setLoading(true); // Podríamos tener un loading específico para esto
      try {
        const productDetails = await getOneProduct(productId);
        setSelectedProductDetails(productDetails);
        // Lanzar verificación si ya hay cantidad
        if (quantityToProduceInput) {
          checkStockAvailability(productDetails, quantityToProduceInput);
        }
      } catch (error) {
        console.error('Error fetching product details:', error);
        message.error('Error al cargar detalles del producto');
        setStockCheckResult({ status: 'error', message: 'Error al cargar composición' });
      } finally {
        setLoading(false);
      }
    } else {
       setSelectedProductDetails(null);
       setStockCheckResult({ status: 'idle' });
    }
  };
  
  // Handler cuando cambia la cantidad a producir
  const handleQuantityChange = (value: number | null) => {
      setQuantityToProduceInput(value);
      if (selectedProductDetails && value !== null && value > 0) {
          checkStockAvailability(selectedProductDetails, value);
      } else {
          setStockCheckResult({ status: 'idle' });
      }
  };

  // --- Lógica de Verificación de Stock --- 
  const checkStockAvailability = (product: Product | null, quantity: number | null) => {
      if (!product || !product.composition || quantity === null || quantity <= 0) {
          setStockCheckResult({ status: 'idle' });
          return;
      }
      
      setStockCheckResult({ status: 'loading' }); // Indicar que se está verificando
      
      const missingMaterials: { name: string, required: number, available: number, unit: string }[] = [];
      let possible = true;

      for (const item of product.composition) {
          const requiredTotal = Number(item.quantity) * quantity;
          // Buscar stock actual en el estado availableRawMaterials
          const rawMaterialInfo = availableRawMaterials.find((rm: RawMaterial) => rm.id === item.rawMaterialId);
          const availableStock = rawMaterialInfo ? Number(rawMaterialInfo.stock) : 0;
          
          if (availableStock < requiredTotal) {
              possible = false;
              missingMaterials.push({
                  name: rawMaterialInfo?.name || `ID ${item.rawMaterialId}`,
                  required: requiredTotal,
                  available: availableStock,
                  unit: rawMaterialInfo?.unit || 'uds'
              });
          }
      }

      if (possible) {
          setStockCheckResult({ status: 'ok', message: 'Stock de materias primas suficiente.' });
      } else {
          setStockCheckResult({ 
              status: 'insufficient', 
              message: 'Falta stock de materias primas:',
              missing: missingMaterials 
          });
      }
  };

  // Handle para crear nueva orden
  const handleCreateSubmit = async () => {
    try {
      const values = await form.validateFields();

      // --- Add stock check before submitting --- 
      if (stockCheckResult.status === 'insufficient') {
          message.error('No se puede crear la orden. Falta stock de materias primas.');
          return; // Stop submission
      }
      // Also check if the status is still loading or idle (meaning check hasn't run or completed)
      if (stockCheckResult.status === 'loading' || stockCheckResult.status === 'idle') {
           message.warning('Por favor, espere a que la verificación de stock se complete o seleccione un producto/cantidad válidos.');
           return;
      }
      if (stockCheckResult.status === 'error') {
           message.error('No se pudo verificar el stock debido a un error. Intente de nuevo.');
           return;
      }
      // --- End stock check --- 

      setIsSubmitting(true);
      message.loading({ content: 'Creando orden...', key: 'createOrder' });
      await createProductionOrder(values);
      message.success({ content: 'Orden creada', key: 'createOrder' });
      setIsModalVisible(false);
      form.resetFields();
      fetchData();
    } catch (error) {
      console.error('Error creating order:', error);
      message.error({ content: 'Error al crear la orden', key: 'createOrder' });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Handle para iniciar, completar, cancelar
  const handleUpdateStatus = async (id: number, status: ProductionOrderStatus, notes?: string) => {
      // Usar claves distintas para cada tipo de mensaje
      const loadingKey = `loading-${id}-${status}`;
      const resultKey = `result-${id}-${status}`;
      
      let loadingMessage = '';
      if (status === ProductionOrderStatus.IN_PROGRESS) loadingMessage = 'Iniciando producción...';
      if (status === ProductionOrderStatus.COMPLETED) loadingMessage = 'Completando producción...';
      if (status === ProductionOrderStatus.CANCELLED) loadingMessage = 'Cancelando orden...';
      
      message.loading({ content: loadingMessage, key: loadingKey });
      setIsSubmitting(true); 
      
      try {
          await updateProductionOrder(id, { status, notes });
          message.destroy(loadingKey);
          message.success({ content: `Orden ${status.toLowerCase()} correctamente`, key: resultKey });
          fetchData();
      } catch (error: unknown) {
          message.destroy(loadingKey);
          console.error(`Error updating order ${id} status to ${status}:`, error);
          let errorMsg = 'Error al actualizar estado';
          if (axios.isAxiosError(error) && error.response?.data?.message) {
              errorMsg = error.response.data.message;
          } else if (error instanceof Error) { 
               errorMsg = error.message;
          }
          // Usar la instancia del hook: modal.error
          modal.error({
              title: 'Error al Actualizar Orden',
              content: errorMsg,
          });
      } finally {
          setIsSubmitting(false);
      }
  };

  const handleDelete = async (id: number) => {
     // ... (Implementación similar a otros deletes) ...
     message.loading({ content: 'Eliminando...', key: `delete-${id}` });
    try {
      await deleteProductionOrder(id);
      message.success({ content: 'Orden eliminada', key: `delete-${id}`, duration: 2 });
      fetchData();
    } catch (error: unknown) {
      console.error('Error deleting order:', error);
       let errorMsg = 'Error al eliminar la orden';
          if (axios.isAxiosError(error) && error.response?.data?.message) {
              errorMsg = Array.isArray(error.response.data.message) ? error.response.data.message.join(', ') : error.response.data.message;
          }
      message.error({ content: errorMsg, key: `delete-${id}`, duration: 3 });
    }
  };

  // --- Columnas Tabla ---
  const columns: ColumnsType<ProductionOrder> = [
    {
      title: 'ID', dataIndex: 'id', key: 'id', sorter: (a, b) => a.id - b.id, width: 80,
    },
    {
      title: 'N° Orden', dataIndex: 'orderNumber', key: 'orderNumber',
      render: (text) => text || '-',
    },
    {
      title: 'Producto',
      dataIndex: 'product',
      key: 'product',
      render: (product: Product) => product ? `${product.name} (${product.code})` : 'N/A',
    },
    {
      title: 'Cantidad', dataIndex: 'quantityToProduce', key: 'quantityToProduce',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: ProductionOrderStatus) => (
        <Tag color={getStatusColor(status)}>{status}</Tag>
      ),
      filters: Object.values(ProductionOrderStatus).map(s => ({ text: s, value: s })),
      onFilter: (value, record) => record.status === value,
    },
    {
        title: 'Creada', 
        dataIndex: 'createdAt',
        key: 'createdAt',
        render: (date: string) => format(new Date(date), 'dd/MM/yyyy HH:mm'),
        sorter: (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: 'Acciones',
      key: 'actions',
      render: (_, record) => (
        <Space size="small">
          {/* Botón Iniciar */} 
          {record.status === ProductionOrderStatus.PENDING && (
             <Button 
                type="primary" 
                icon={<PlayCircleOutlined />} 
                onClick={() => handleUpdateStatus(record.id, ProductionOrderStatus.IN_PROGRESS)}
                size="small"
                disabled={isSubmitting} // Deshabilitar mientras otra acción ocurre
             >Iniciar</Button>
          )}
          {/* Botón Completar */} 
          {record.status === ProductionOrderStatus.IN_PROGRESS && (
             <Button 
                type="primary" 
                style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} // Verde
                icon={<CheckCircleOutlined />} 
                onClick={() => handleUpdateStatus(record.id, ProductionOrderStatus.COMPLETED)}
                size="small"
                disabled={isSubmitting}
             >Completar</Button>
          )}
           {/* Botón Cancelar */} 
           {record.status === ProductionOrderStatus.PENDING && ( 
                <Popconfirm
                    title="¿Cancelar esta orden?"
                    onConfirm={() => handleUpdateStatus(record.id, ProductionOrderStatus.CANCELLED, 'Cancelada por usuario')}
                    okText="Sí" cancelText="No"
                >
                    <Button 
                        danger 
                        icon={<CloseCircleOutlined />} 
                        size="small"
                        disabled={isSubmitting}
                    >Cancelar</Button>
                </Popconfirm>
            )}
           {/* Botón Eliminar */} 
           {(record.status === ProductionOrderStatus.PENDING || record.status === ProductionOrderStatus.CANCELLED) && (
                <Popconfirm
                    title="¿Eliminar esta orden permanentemente?"
                    onConfirm={() => handleDelete(record.id)}
                    okText="Sí" cancelText="No"
                >
                    <Button danger icon={<DeleteOutlined />} size="small" disabled={isSubmitting} />
                </Popconfirm>
            )}
           {/* Botón Ver Detalles (TODO) */}
           {/* <Button icon={<EyeOutlined />} size="small">Ver</Button> */}
        </Space>
      ),
    },
  ];

  // --- Renderizado --- 
  return (
    <div>
      {/* Renderizar contextHolder para el hook Modal */}
      {contextHolder}
      
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={2}>Órdenes de Producción</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Nueva Orden
        </Button>
      </Space>

      <Table columns={columns} dataSource={orders} rowKey="id" loading={loading} />

      {/* Modal Crear Orden */}
      <Modal
        title="Nueva Orden de Producción"
        open={isModalVisible}
        okButtonProps={{ 
          disabled: stockCheckResult.status === 'insufficient' || stockCheckResult.status === 'loading' || stockCheckResult.status === 'error' || isSubmitting 
        }}
        onOk={handleCreateSubmit}
        onCancel={handleCancelModal}
        confirmLoading={isSubmitting}
        okText="Crear Orden"
        cancelText="Cancelar"
      >
        <Form form={form} layout="vertical" name="createOrderForm">
          <Form.Item 
            name="productId"
            label="Producto a Fabricar"
            rules={[{ required: true, message: 'Seleccione un producto' }]}
          >
            <Select
              showSearch
              placeholder="Seleccione el producto"
              optionFilterProp="label"
              filterOption={(input, option) => 
                 (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              loading={loading}
              options={products.map(p => ({ value: p.id, label: `${p.name} (${p.code})` }))}
              onChange={handleProductChange} 
              allowClear
              value={form.getFieldValue('productId')}
            />
          </Form.Item>

          {selectedProductDetails?.composition && selectedProductDetails.composition.length > 0 && (
            <div style={{ marginBottom: '16px', padding: '8px', border: '1px solid #d9d9d9', borderRadius: '4px' }}>
              <strong>Requiere por unidad:</strong>
              <ul>
                {selectedProductDetails.composition.map(item => (
                   <li key={item.rawMaterialId}>
                      {item.rawMaterial?.name || `ID: ${item.rawMaterialId}`}: {Number(item.quantity).toFixed(3)} {item.rawMaterial?.unit || 'uds'}
                   </li> 
                ))}
              </ul>
            </div>
          )}

           <Form.Item 
            name="quantityToProduce"
            label="Cantidad a Producir"
            rules={[{ required: true, message: 'Ingrese la cantidad' }, { type: 'number', min: 1, message: 'Debe ser mayor a 0' }]}
          >
            <InputNumber 
              min={1} 
              style={{ width: '100%' }} 
              onChange={handleQuantityChange} 
              value={quantityToProduceInput}
            />
          </Form.Item>

          {stockCheckResult.status !== 'idle' && (
             <Alert
               style={{ marginBottom: '16px' }}
               message={stockCheckResult.message}
               type={stockCheckResult.status === 'ok' ? 'success' : 
                     stockCheckResult.status === 'insufficient' ? 'warning' : 
                     stockCheckResult.status === 'loading' ? 'info' : 'error'}
               showIcon
               description={stockCheckResult.status === 'insufficient' && stockCheckResult.missing && (
                 <ul>
                   {stockCheckResult.missing.map(m => (
                     <li key={m.name}>{`${m.name}: necesita ${m.required.toFixed(3)} ${m.unit}, disponible ${m.available.toFixed(2)} ${m.unit}`}</li>
                   ))}
                 </ul>
               )}
             />
          )}

           <Form.Item name="orderNumber" label="N° Orden (Opcional)">
            <Input placeholder="Ej: OP-001" />
          </Form.Item>
          <Form.Item name="notes" label="Notas (Opcional)">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductionOrdersPage; 