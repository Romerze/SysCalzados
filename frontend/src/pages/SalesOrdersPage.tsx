import React, { useState, useEffect, useMemo } from 'react';
import {
  Button,
  Typography,
  Space,
  Table,
  message,
  Modal,
  Tag,
  Form,
  Input,
  InputNumber,
  Select,
  Divider,
  Statistic,
  notification,
  Tooltip,
  Popconfirm,
} from 'antd';
import type { TableProps } from 'antd/es/table';
import {
  PlusOutlined,
  EyeOutlined,
  EditOutlined,
  DeleteOutlined,
  MinusCircleOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  CloseCircleOutlined,
  CarOutlined,
  CheckSquareOutlined,
} from '@ant-design/icons';
import { SalesOrder, Client, Product, SalesOrderStatus /*, SalesOrderItem */ } from '../types/models'; // Comment out or remove SalesOrderItem if unused
import { 
    createSalesOrder, updateSalesOrder, deleteSalesOrder,
    getSalesOrders, getClients, getProducts, getSalesOrderById,
    CreateSalesOrderPayload, UpdateSalesOrderPayload, SalesOrderItemPayload
} from '../services/api';
import ViewDetailsModal from '../components/ViewDetailsModal';
import axios from 'axios';

const { Title } = Typography;
// const { Option } = Select; // Ensure this is commented out or removed
// const { confirm } = Modal;

const getStatusText = (status: SalesOrderStatus): string => {
  switch (status) {
    case SalesOrderStatus.PENDING: return 'Pendiente';
    case SalesOrderStatus.CONFIRMED: return 'Confirmado';
    case SalesOrderStatus.PROCESSING: return 'Procesando';
    case SalesOrderStatus.SHIPPED: return 'Enviado';
    case SalesOrderStatus.DELIVERED: return 'Entregado';
    case SalesOrderStatus.CANCELLED: return 'Cancelado';
    case SalesOrderStatus.REFUNDED: return 'Reembolsado';
    default: return status;
  }
};

const getStatusColor = (status: SalesOrderStatus): string => {
  switch (status) {
    case SalesOrderStatus.PENDING: return 'gold';
    case SalesOrderStatus.CONFIRMED: return 'processing';
    case SalesOrderStatus.PROCESSING: return 'purple';
    case SalesOrderStatus.SHIPPED: return 'cyan';
    case SalesOrderStatus.DELIVERED: return 'success';
    case SalesOrderStatus.CANCELLED: return 'error';
    case SalesOrderStatus.REFUNDED: return 'orange';
    default: return 'default';
  }
};

// Define structure for the form values
interface SalesOrderFormValues {
  clientId?: number | null;
  notes?: string;
  items?: FormListItem[]; 
}

// Define minimal interface for Antd validation errors
interface FieldError {
  name: (string | number)[]; 
  errors: string[];
}

interface ValidationErrorInfo {
  errorFields: FieldError[];
  values: SalesOrderFormValues; 
}

// Define FormListItem structure locally if needed (or ensure it's defined elsewhere)
interface FormListItem {
    productId?: number | null;
    quantity?: number | null;
    unitPrice?: number | null;
}

const SalesOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<SalesOrder[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form] = Form.useForm<SalesOrderFormValues>();
  const [modal, modalContextHolder] = Modal.useModal();
  const [notificationApi, notificationContextHolder] = notification.useNotification();

  // New states for edit/view logic
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
  const [editingOrder, setEditingOrder] = useState<SalesOrder | null>(null);

  // New states for View Modal
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingOrder, setViewingOrder] = useState<SalesOrder | null>(null);

  // itemsValue will infer its type from form state
  const itemsValue = Form.useWatch('items', form);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [ordersData, clientsData, productsData] = await Promise.all([
        getSalesOrders(),
        getClients(),
        getProducts(),
      ]);
      setOrders(ordersData);
      setClients(clientsData);
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching initial data:', error);
      message.error('Error al cargar datos iniciales.');
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setModalMode('create'); // Set mode to create
    setEditingOrder(null); // Clear any editing order
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleCancelModal = () => {
    setModalMode('create'); // Reset mode on cancel
    setEditingOrder(null);
    form.resetFields();
    setIsModalVisible(false);
  };

  const handleView = async (id: number) => {
    const actionKey = `loadView-${id}`;
    message.loading({ content: 'Cargando detalles del pedido...', key: actionKey });
    try {
        // Fetch full order details including items
        const orderDetails = await getSalesOrderById(id);
        setViewingOrder(orderDetails);
        setIsViewModalVisible(true);
        message.destroy(actionKey);
    } catch (error) {
        message.destroy(actionKey);
        console.error(`Error loading order ${id} for view:`, error);
        message.error('Error al cargar los detalles del pedido.');
    }
  };

  const handleCloseViewModal = () => {
    setIsViewModalVisible(false);
    setViewingOrder(null);
  };

  const handleEdit = async (id: number) => {
    // ---- DEBUG LOG ----
    console.log(`handleEdit called for order ID: ${id}`); 
    const actionKey = `loadEdit-${id}`;
    message.loading({ content: 'Cargando datos del pedido...', key: actionKey });
    try {
      const orderToEdit = await getSalesOrderById(id);
      
      setModalMode('edit'); // Set mode to edit
      setEditingOrder(orderToEdit); 

      // Pre-fill form. Ensure items is an array.
      form.setFieldsValue({
        clientId: orderToEdit.clientId,
        notes: orderToEdit.notes,
        items: orderToEdit.items?.map(item => ({
          productId: item.productId,
          quantity: Number(item.quantity), // Ensure number for InputNumber
          unitPrice: Number(item.unitPrice), // Ensure number for InputNumber
        })) || [],
      });

      setIsModalVisible(true); // Use the main modal
      message.destroy(actionKey);

    } catch (error) {
      message.destroy(actionKey);
      console.error(`Error loading order ${id} for edit:`, error);
      message.error('Error al cargar los datos para editar.');
    }
  };

  const handleDelete = async (id: number) => {
    const actionKey = `deleteOrder-${id}`;
    message.loading({ content: 'Eliminando pedido...', key: actionKey });
    try {
      await deleteSalesOrder(id);
      message.success({ content: 'Pedido eliminado correctamente', key: actionKey });
      fetchData(); // Refresh data after delete
    } catch (error: unknown) {
      message.destroy(actionKey); // Remove loading message on error
      console.error(`Error deleting order ${id}:`, error);
      let errorMsg = 'Error al eliminar el pedido.';
      if (axios.isAxiosError(error) && error.response?.data?.message) {
        errorMsg = Array.isArray(error.response.data.message) 
                    ? error.response.data.message.join('; ') 
                    : error.response.data.message;
      }
      modal.error({ title: 'Error al Eliminar', content: errorMsg });
    }
  };

  const handleModalSubmit = async () => {
    const actionKeySuffix = modalMode === 'create' ? 'createOrder' : `updateOrder-${editingOrder?.id}`;
    const actionKey = `submit-${actionKeySuffix}`;
    
    let formValues: SalesOrderFormValues | undefined = undefined;
    let proceedWithApiCall = false;

    try {
      formValues = await form.validateFields();
      proceedWithApiCall = true; 
    } catch (errorInfo: unknown) { 
      if (
        typeof errorInfo === 'object' && 
        errorInfo !== null && 
        'errorFields' in errorInfo && 
        Array.isArray((errorInfo as { errorFields: unknown[] }).errorFields) &&
        'values' in errorInfo
      ) {
          const validationError = errorInfo as ValidationErrorInfo;
          const nonWarningErrors = validationError.errorFields.filter(
            (field: FieldError) => 
              !field.errors.every((errMsg: string) => errMsg.startsWith('Advertencia: Cantidad supera stock'))
          );

          if (nonWarningErrors.length === 0) {
            console.warn('Validation failed only due to stock warnings. Proceeding.');
            formValues = validationError.values;
            proceedWithApiCall = true;
          } else {
            console.error('Form validation failed:', validationError.errorFields);
            message.error('Por favor, corrija los errores en el formulario.');
            proceedWithApiCall = false;
          }
      } else {
          console.error('Unexpected error during form validation:', errorInfo);
          message.error('Error inesperado al validar el formulario.');
          proceedWithApiCall = false;
      }
    }

    if (proceedWithApiCall && formValues) { 
       setIsSubmitting(true);
       message.loading({ content: modalMode === 'create' ? 'Creando pedido...' : 'Actualizando pedido...', key: actionKey });
       try {
           if (modalMode === 'create') {
                const createPayload: CreateSalesOrderPayload = {
                    clientId: formValues.clientId ?? 0,
                    notes: formValues.notes,
                    items: formValues.items?.map((item: FormListItem): SalesOrderItemPayload => ({
                        productId: Number(item.productId ?? 0), 
                        quantity: Number(item.quantity ?? 0), 
                        unitPrice: Number(item.unitPrice ?? 0) 
                    }))?.filter(item => item.productId !== 0 && item.quantity > 0)
                    || []
                };
                if (!createPayload.clientId) {
                   throw new Error("Client ID is missing.");
                }
                if (createPayload.items.length === 0) {
                    throw new Error("Debe añadir al menos un ítem válido.");
                }
                await createSalesOrder(createPayload);
                message.success({ content: 'Pedido creado con éxito', key: actionKey });
           } else if (modalMode === 'edit' && editingOrder) {
               const updatePayload: UpdateSalesOrderPayload = {
                    notes: formValues.notes,
                    items: formValues.items?.map((item: FormListItem | null): SalesOrderItemPayload | null => { 
                        if (!item?.productId || item.quantity === undefined || item.quantity === null || item.quantity <= 0 || item.unitPrice === undefined || item.unitPrice === null || item.unitPrice <= 0) {
                           return null; 
                        }
                        return {
                           productId: Number(item.productId), 
                           quantity: Number(item.quantity), 
                           unitPrice: Number(item.unitPrice)
                        };
                     })
                     ?.filter((item): item is SalesOrderItemPayload => item !== null) 
                     ?? [] 
                };
               await updateSalesOrder(editingOrder.id, updatePayload);
               message.success({ content: 'Pedido actualizado correctamente', key: actionKey });
           }
           setIsModalVisible(false);
           fetchData();
       } catch (apiError: unknown) {
           message.destroy(actionKey); 
           console.error('Error creating/updating sales order (API Call Failed):', apiError);
           let errorMsg = modalMode === 'create' ? 'Error al crear el pedido.' : 'Error al actualizar el pedido.';
           if (axios.isAxiosError(apiError) && apiError.response?.data?.message) {
               errorMsg = Array.isArray(apiError.response.data.message) 
                           ? apiError.response.data.message.join('; ') 
                           : apiError.response.data.message;
           }
           const errorTitle = modalMode === 'create' ? 'Error al Crear' : 'Error al Actualizar';
           modal.error({ title: errorTitle, content: errorMsg });
       } finally {
           setIsSubmitting(false);
       }
    } 
  };

  // --- Handle Status Update ---
  const handleUpdateStatus = async (id: number, status: SalesOrderStatus, actionText: string) => {
    const key = `update-status-${id}-${status}`;
    message.loading({ content: `${actionText}...`, key });
    try {
      const updatedOrder = await updateSalesOrder(id, { status });
      setOrders(prevOrders => prevOrders.map(order => (order.id === id ? updatedOrder : order)));
      message.success({ content: `Pedido ${actionText.toLowerCase()} correctamente`, key });
    } catch (error: unknown) {
      // Log the raw error and extracted message for debugging
      console.error(`[DEBUG] Raw error object in handleUpdateStatus catch:`, error);
      
      let errorMsg = `Error al ${actionText.toLowerCase()} el pedido.`;
      let isStockErrorWithPO = false;
      
      if (axios.isAxiosError(error) && error.response?.data?.message) {
         errorMsg = Array.isArray(error.response.data.message)
           ? error.response.data.message.join('; ')
           : error.response.data.message;
         
         console.log(`[DEBUG] Extracted errorMsg:`, errorMsg);

         // Check if the error message indicates insufficient stock and PO creation attempt
         if (typeof errorMsg === 'string' && errorMsg.includes('Stock insuficiente') && errorMsg.includes('órdenes de producción')) {
            console.log(`[DEBUG] Detected stock error with PO creation attempt.`);
            isStockErrorWithPO = true;
         } else {
            console.log(`[DEBUG] Did NOT detect stock error with PO creation attempt.`);
         }
      } else {
           console.log(`[DEBUG] Error is not AxiosError or message structure is different.`);
      }

      message.destroy(key); // Remove loading message first
      
      if (isStockErrorWithPO) {
         // Use notification API from hook
         notificationApi.warning({
            message: `No se pudo confirmar el pedido #${id}`,
            description: errorMsg, // Show the detailed message from backend
            duration: 0, // Keep open until manually closed
            key: `stock-error-po-${id}`, // Unique key for this notification
         });
      } else {
         // Use standard message.error for other errors
         message.error({ content: errorMsg, duration: 5 });
      }
    }
  };

  // --- Handle Product Change within Form Item --- 
  const handleProductItemChange = (productId: number, fieldIndex: number) => {
    const product = products.find(p => p.id === productId);
    if (product && product.sellingPrice !== null && product.sellingPrice !== undefined) {
      const price = Number(product.sellingPrice);
      if (!isNaN(price)) {
        // Get current items values
        const currentItems: FormListItem[] = form.getFieldValue('items') || [];
        // Create a new array with the updated item
        const updatedItems = currentItems.map((item, index) => {
          if (index === fieldIndex) {
            // Return a new object for the updated item
            return { ...item, unitPrice: price };
          } 
          // Return existing item object if not the one being changed
          return item;
        });
        // Set the value with the entire updated items array
        form.setFieldsValue({ items: updatedItems });
      } else {
        console.error(`Invalid selling price found for product ${productId}: ${product.sellingPrice}`);
      }
    } else {
        console.warn(`Product ${productId} not found or has no selling price.`);
        // Optionally clear the price if product is invalid?
        // const currentItems = form.getFieldValue('items') || [];
        // const updatedItems = currentItems.map((item, index) => index === fieldIndex ? { ...item, unitPrice: undefined } : item);
        // form.setFieldsValue({ items: updatedItems });
    }
  };

  // Use the specific type in calculateFormTotal
  const calculateFormTotal = (items: FormListItem[] | undefined | null): number => {
    if (!items) return 0;
    // Use reduce safely
    return items.reduce((sum: number, item: FormListItem | null) => { // Add types for sum and item
       if (!item) return sum; // Skip null items
       const quantity = Number(item?.quantity ?? 0);
       const price = Number(item?.unitPrice ?? 0);
       // Ensure calculation doesn't result in NaN
       return sum + (isNaN(quantity) || isNaN(price) ? 0 : quantity * price);
     }, 0);
  };

  const columns: TableProps<SalesOrder>['columns'] = useMemo(() => [
    {
      title: 'Nº Orden',
      dataIndex: 'orderNumber',
      key: 'orderNumber',
      sorter: (a, b) => (a.orderNumber ?? '').localeCompare(b.orderNumber ?? ''),
    },
    {
      title: 'Cliente',
      dataIndex: 'client',
      key: 'clientName',
      render: (client: Client | null | undefined) => client ? `${client.firstName} ${client.lastName}` : 'N/A',
    },
    {
      title: 'Fecha Pedido',
      dataIndex: 'orderDate',
      key: 'orderDate',
      render: (date: string) => date ? new Date(date).toLocaleDateString() : 'N/A',
      sorter: (a, b) => new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime(),
      defaultSortOrder: 'descend',
    },
    {
      title: 'Estado',
      dataIndex: 'status',
      key: 'status',
      render: (status: SalesOrderStatus) => <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>,
      filters: Object.values(SalesOrderStatus).map(s => ({ text: getStatusText(s), value: s })),
      onFilter: (value, record) => record.status === value,
    },
    {
      title: 'Producción',
      key: 'productionStatus',
      align: 'center',
      render: (_, record: SalesOrder) => {
        const total = record.totalProductionOrders;
        const completed = record.completedProductionOrders;

        if (total !== undefined && total > 0) {
          if (completed !== undefined && completed >= total) {
            return <Tooltip title="Producción completada"><CheckCircleOutlined style={{ color: 'green', fontSize: '18px' }} /></Tooltip>;
          } else {
            return <Tooltip title="Producción pendiente/en progreso"><SyncOutlined spin style={{ color: 'orange', fontSize: '18px' }} /></Tooltip>;
          }
        } 
        return <span style={{ color: '#ccc' }}>-</span>; // No production needed/triggered
      },
    },
    {
      title: 'Total',
      dataIndex: 'totalAmount',
      key: 'totalAmount',
      align: 'right',
      render: (amount: number | null | undefined) => {
          const numAmount = Number(amount);
          return amount === null || amount === undefined || isNaN(numAmount)
            ? '-' 
            : `$${numAmount.toFixed(2)}`;
      },
      sorter: (a, b) => {
        const numA = Number(a.totalAmount);
        const numB = Number(b.totalAmount);
        if (isNaN(numA)) return -1;
        if (isNaN(numB)) return 1;
        return numA - numB;
      },
    },
    {
      title: 'Acciones',
      key: 'actions',
      align: 'center',
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="Ver Detalles">
             <Button icon={<EyeOutlined />} onClick={() => handleView(record.id)} size="small" />
          </Tooltip>
          {(record.status === SalesOrderStatus.PENDING) && (
              <Tooltip title="Editar Pedido">
                  <Button icon={<EditOutlined />} onClick={() => handleEdit(record.id)} size="small" />
              </Tooltip>
          )}
          {(record.status === SalesOrderStatus.PENDING || record.status === SalesOrderStatus.CANCELLED) && (
              <Tooltip title="Eliminar Pedido">
                  <Popconfirm
                    title={<div>¿Está seguro que desea eliminar este pedido?<br/>Esta acción no se puede deshacer.</div>}
                    onConfirm={() => handleDelete(record.id)}
                    okText="Sí, eliminar"
                    okType="danger"
                    cancelText="No"
                  >
                    <Button 
                       danger 
                       icon={<DeleteOutlined />} 
                       size="small" 
                     />
                  </Popconfirm>
              </Tooltip>
          )}
          {record.status === SalesOrderStatus.PENDING && (
             <Tooltip title="Confirmar Pedido (Verificará Stock)">
               <Button 
                 type="link" 
                 icon={<CheckCircleOutlined />} 
                 onClick={() => handleUpdateStatus(record.id, SalesOrderStatus.CONFIRMED, 'Confirmando')} 
                 size="small" 
                 style={{ color: '#52c41a' }} 
               />
             </Tooltip>
          )}
          {record.status === SalesOrderStatus.CONFIRMED && (
             <Tooltip title="Marcar como Enviado">
               <Button 
                 type="link" 
                 icon={<CarOutlined />} 
                 onClick={() => handleUpdateStatus(record.id, SalesOrderStatus.SHIPPED, 'Marcando como Enviado')} 
                 size="small" 
                 style={{ color: '#722ed1' }} 
               />
             </Tooltip>
          )}
           {record.status === SalesOrderStatus.SHIPPED && (
             <Tooltip title="Marcar como Entregado">
               <Button 
                 type="link" 
                 icon={<CheckSquareOutlined />} 
                 onClick={() => handleUpdateStatus(record.id, SalesOrderStatus.DELIVERED, 'Marcando como Entregado')} 
                 size="small" 
                 style={{ color: '#52c41a' }}
               />
             </Tooltip>
          )}
          {record.status !== SalesOrderStatus.CANCELLED && record.status !== SalesOrderStatus.DELIVERED && (
            <Tooltip title="Cancelar Pedido">
              <Popconfirm
                title={<div>¿Está seguro que desea cancelar este pedido?<br />Esta acción no se puede deshacer.</div>}
                onConfirm={() => {
                  handleUpdateStatus(record.id, SalesOrderStatus.CANCELLED, 'Cancelando');
                }}
                okText="Sí, cancelar"
                okType="danger"
                cancelText="No"
              >
                <Button 
                  danger 
                  type="link" 
                  icon={<CloseCircleOutlined />} 
                  size="small"
                />
              </Popconfirm>
            </Tooltip>
          )}
        </Space>
      ),
    },
  ], [handleEdit, handleView, handleDelete, handleUpdateStatus]);

  return (
    <div>
      {modalContextHolder}
      {notificationContextHolder}
      {/* Flex container for Title and Button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Title level={2} style={{ margin: 0 }}>Gestión de Pedidos de Venta</Title>
        <Space> {/* Keep Space in case other buttons are added */}
          <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
            Nuevo Pedido
          </Button>
        </Space>
      </div>

      <Table
        columns={columns}
        dataSource={orders}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
      />

      <Modal
        title={modalMode === 'create' ? 'Crear Pedido de Venta' : `Editar Pedido #${editingOrder?.orderNumber || editingOrder?.id}`}
        open={isModalVisible}
        onCancel={handleCancelModal}
        width={850}
        footer={[
          <Button key="back" onClick={handleCancelModal}>
            Cancelar
          </Button>,
          <Button key="submit" type="primary" loading={isSubmitting} onClick={handleModalSubmit}>
            {modalMode === 'create' ? 'Guardar Pedido' : 'Actualizar Pedido'}
          </Button>,
        ]}
      >
        <Form form={form} layout="vertical" name="salesOrderForm">
          <Form.Item 
            name="clientId" 
            label="Cliente" 
            rules={[{ required: true, message: 'Seleccione un cliente' }]}
          >
            <Select 
              showSearch 
              placeholder="Buscar cliente..."
              optionFilterProp="label"
              filterOption={(input, option) => 
                 (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              options={clients.map(client => ({
                 value: client.id,
                 label: `${client.firstName} ${client.lastName} (${client.dni})`
              }))}
              loading={loading}
              disabled={modalMode === 'edit'}
            />
          </Form.Item>
          <Form.Item name="notes" label="Notas Adicionales (Editable)">
            <Input.TextArea rows={2} />
          </Form.Item>

          <Divider>
            {(() => {
              const allowEditing = modalMode === 'create' || (modalMode === 'edit' && editingOrder?.status === SalesOrderStatus.PENDING);
              return allowEditing ? 'Ítems del Pedido' : 'Ítems del Pedido (No editable)';
            })()}
          </Divider>

          <Form.List name="items">
            {(fields, { add, remove }) => {
              // Determine if item editing is allowed based on mode and order status
              const allowItemEditing = modalMode === 'create' || (modalMode === 'edit' && editingOrder?.status === SalesOrderStatus.PENDING);

              return (
                <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
                  {fields.map(({ key, name, ...restField }) => {
                    const currentItemValues = itemsValue?.[name];
                    const itemQuantity = Number(currentItemValues?.quantity ?? 0);
                    const itemPrice = Number(currentItemValues?.unitPrice ?? 0);
                    const subtotal = itemQuantity * itemPrice;
                    
                    return (
                      <Space key={key} style={{ display: 'flex', alignItems: 'baseline', width: '100%' }} align="baseline">
                        <Form.Item
                          {...restField}
                          name={[name, 'productId']}
                          style={{ marginBottom: 0, flexGrow: 1 }}
                        >
                          <Select 
                            showSearch 
                            placeholder="Producto"
                            optionFilterProp="label"
                            filterOption={(input, option) => 
                               (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                            }
                            options={products.map(prod => ({
                               value: prod.id,
                               label: `${prod.name} (${prod.code}) - Stock: ${prod.stock ?? 'N/A'}`
                            }))}
                            onChange={(value) => handleProductItemChange(value, name)}
                            disabled={!allowItemEditing}
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'quantity']}
                          rules={[
                            { required: true, message: 'Cant?' }, 
                            { type: 'number', message: 'Debe ser número'},
                            { type: 'number', min: 1, message: 'Min 1'},
                            {
                              validator: (_, value) => {
                                const itemsData = form.getFieldValue('items');
                                const currentItem = itemsData?.[name];
                                const productId = currentItem?.productId;
                                
                                if (productId && value) {
                                  const product = products.find(p => p.id === productId);
                                  if (product && product.stock !== undefined && value > product.stock) {
                                    return Promise.reject(new Error(`Advertencia: Cantidad supera stock (${product.stock})`));
                                  }
                                }
                                return Promise.resolve();
                              },
                            }
                          ]}
                          style={{ marginBottom: 0 }}
                          hasFeedback
                        >
                          <InputNumber 
                            placeholder="Cant." 
                            style={{ width: '80px'}} 
                            min={1} 
                            disabled={!allowItemEditing}
                          />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'unitPrice']}
                          rules={[
                            { required: true, message: 'Precio?' }, 
                            { type: 'number', message: 'Debe ser número'},
                            { type: 'number', min: 0.01, message: 'Precio debe ser positivo'}
                          ]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber 
                            addonBefore="S/" 
                            placeholder="Precio U." 
                            style={{ width: '130px'}} 
                            min={0.01} 
                            step={0.1} 
                            disabled={true} 
                          />
                        </Form.Item>
                        <Statistic 
                            title="Subtotal" 
                            value={subtotal} 
                            precision={2} 
                            prefix="S/" 
                            valueStyle={{ fontSize: '1em' }} 
                            style={{ width: '120px', textAlign: 'right'}} 
                        />
                        {allowItemEditing && (
                          <MinusCircleOutlined 
                             onClick={() => remove(name)} 
                             style={{ color: 'red', marginLeft: 8 }} 
                             title="Quitar Ítem"
                          />
                        )}
                      </Space>
                    );
                  })}
                  {allowItemEditing && (
                    <Form.Item>
                      <Button 
                        type="dashed" 
                        onClick={() => add({ quantity: 1 })}
                        block 
                        icon={<PlusOutlined />} 
                        title="Añadir Ítem"
                      >
                        Añadir Ítem
                      </Button>
                    </Form.Item>
                  )}
                </div>
              );
            }}
          </Form.List>
          <Divider />
          <div style={{ textAlign: 'right' }}>
             <Statistic title="Total Pedido" value={calculateFormTotal(itemsValue)} precision={2} prefix="S/" />
         </div>

        </Form>
      </Modal>

      {viewingOrder && (
          <ViewDetailsModal
            visible={isViewModalVisible}
            order={viewingOrder} 
            onClose={handleCloseViewModal} 
          />
      )}
    </div>
  );
};

export default SalesOrdersPage; 