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
  InputNumber, // Añadir InputNumber para precios y stock
  InputRef,
  List, // Importar List para mostrar composición
  Select,
  Steps, // Importar Steps
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
// Importar tipo Product y funciones API
import { Product, RawMaterial } from '../types/models';
import { 
  getProducts, deleteProduct, createProduct, updateProduct, 
  getRawMaterials, getOneProduct, 
} from '../services/api';
import axios from 'axios';
import Highlighter from 'react-highlight-words';

const { Title } = Typography;

// Definir tipos de Payload localmente
type CompositionItemPayload = {
  rawMaterialId: number;
  quantity: number;
};
type CreateProductPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'composition'> & {
  composition?: CompositionItemPayload[];
};
type UpdateProductPayload = Partial<Omit<CreateProductPayload, 'code'>> & { // Código no suele ser actualizable
  code?: string; // Permitir actualizar código, pero manejarlo con cuidado
  composition?: CompositionItemPayload[]; // Permitir actualizar composición
};

type DataIndex = keyof Product; 

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isViewModalVisible, setIsViewModalVisible] = useState(false);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null); 
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);
  // Estado para materias primas disponibles
  const [availableRawMaterials, setAvailableRawMaterials] = useState<RawMaterial[]>([]); 
  // Usar CompositionItemState para el estado local
  const [currentComposition, setCurrentComposition] = useState<CompositionItemPayload[]>([]); 
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState<number | undefined>(undefined);
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(1);
  // Nuevo estado para el paso actual
  const [currentStep, setCurrentStep] = useState(0);

  const [form] = Form.useForm();

  // --- Funciones de Búsqueda/Filtro --- 
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

  const getColumnSearchProps = (dataIndex: DataIndex): ColumnType<Product> => ({
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
    onFilterDropdownOpenChange: (visible: boolean) => { 
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
    render: (text) => {
        // Formatear precios para mostrar con 2 decimales
        if (dataIndex === 'sellingPrice' || dataIndex === 'purchasePrice') {
            const numberValue = typeof text === 'number' ? text : parseFloat(text);
            return numberValue ? `S/ ${numberValue.toFixed(2)}` : '-'; // Mostrar con símbolo de Soles
        }
        return searchedColumn === dataIndex ? (
            <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={text ? text.toString() : ''}
            />
        ) : (
            text
        );
    }
  });
  // --- Fin Funciones de Búsqueda/Filtro ---

  // --- Fetch Data --- 
  const fetchData = async () => {
    setLoading(true);
    try {
      // Cargar productos y materias primas en paralelo
      const [productsData, rawMaterialsData] = await Promise.all([
        getProducts(),
        getRawMaterials(),
      ]);
      setProducts(productsData);
      setAvailableRawMaterials(rawMaterialsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      message.error('Error al cargar datos iniciales');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(); // Llamar a la nueva función fetchData
  }, []);

  const handleAdd = () => {
    setEditingProduct(null);
    form.resetFields();
    form.setFieldsValue({ stock: 0 }); // Inicializar otros campos si es necesario
    setCurrentComposition([]); // Inicializar composición vacía
    setIsModalVisible(true);
  };

  const handleEdit = async (product: Product) => {
    setLoading(true); 
    try {
      const productWithDetails = await getOneProduct(product.id);
      setEditingProduct(productWithDetails);
      
      // Preparar la composición actual para el estado (solo id y quantity)
      const initialComposition = productWithDetails.composition?.map(item => ({
        rawMaterialId: item.rawMaterialId,
        quantity: Number(item.quantity) // Asegurarse que quantity es número
      })) || [];
      setCurrentComposition(initialComposition);

      form.setFieldsValue({ 
        ...productWithDetails,
        sellingPrice: Number(productWithDetails.sellingPrice),
        purchasePrice: productWithDetails.purchasePrice ? Number(productWithDetails.purchasePrice) : undefined,
      });
      setIsModalVisible(true);
    } catch (error) {
       console.error("Error fetching product details for edit:", error);
       message.error("Error al cargar detalles del producto para editar");
    } finally {
        setLoading(false);
    }
  };

  const handleCancelModal = () => {
    setIsModalVisible(false);
    setEditingProduct(null);
    setCurrentComposition([]); // Limpiar composición al cancelar
    setCurrentStep(0); // Resetear al paso 0
    form.resetFields();
  };

  const handleDelete = async (id: number) => {
    message.loading({ content: 'Eliminando...', key: `delete-${id}` });
    try {
      await deleteProduct(id);
      message.success({ content: 'Producto eliminado', key: `delete-${id}`, duration: 2 });
      fetchData();
    } catch (error) {
      console.error('Error deleting product:', error);
      message.error({ content: 'Error al eliminar el producto', key: `delete-${id}`, duration: 3 });
    }
  };

  const handleModalSubmit = async () => {
    try {
      const values = form.getFieldsValue(true); // Obtener todos los valores
      setIsSubmitting(true);
      const basePayload = { 
         ...values,
         stock: Number(values.stock ?? 0),
         sellingPrice: Number(values.sellingPrice),
         purchasePrice: values.purchasePrice ? Number(values.purchasePrice) : undefined,
      };
      delete basePayload.rawMaterialIds; 
      
      let finalPayload: CreateProductPayload | UpdateProductPayload;
      if (editingProduct) {
        finalPayload = { ...basePayload, composition: currentComposition } as UpdateProductPayload; 
      } else {
        finalPayload = { ...basePayload, composition: currentComposition } as CreateProductPayload;
      }
      const actionKey = editingProduct ? 'update' : 'create';
      message.loading({ content: editingProduct ? 'Actualizando...' : 'Creando...', key: actionKey });
      if (editingProduct) {
        await updateProduct(editingProduct.id, finalPayload as UpdateProductPayload);
        message.success({ content: 'Producto actualizado', key: actionKey, duration: 2 });
      } else {
        await createProduct(finalPayload as CreateProductPayload);
        message.success({ content: 'Producto creado', key: actionKey, duration: 2 });
      }
      setIsModalVisible(false);
      setEditingProduct(null);
      setCurrentComposition([]);
      setCurrentStep(0); // Resetear al paso 0
      form.resetFields();
      fetchData();
    } catch (error: unknown) {
      console.error('Form submission error:', error);
      let errorMessage = editingProduct ? 'Error al actualizar' : 'Error al crear';
      if (axios.isAxiosError(error) && error.response?.data) {
        if (error.response.status === 409 && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.message) {
          if (Array.isArray(error.response.data.message)) {
            errorMessage = error.response.data.message.join(', ');
          } else {
             errorMessage = error.response.data.message;
          }
        }
      } else if (typeof error === 'object' && error !== null && 'errorFields' in error) { 
         errorMessage = "Por favor, corrija los errores en el formulario.";
      } 
      message.error({ content: errorMessage, key: editingProduct ? 'update' : 'create', duration: 4 });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleView = async (product: Product) => {
    setLoading(true); // Indicar carga
    try {
      // Llamar a getOneProduct para obtener detalles completos
      const productWithDetails = await getOneProduct(product.id);
      setViewingProduct(productWithDetails); // Usar datos completos
      setIsViewModalVisible(true);
    } catch (error) {
      console.error("Error fetching product details for view:", error);
      message.error("Error al cargar detalles del producto");
    } finally {
      setLoading(false);
    }
  };

  // --- Lógica para manejar composición --- 
  const handleAddCompositionItem = () => {
    if (selectedRawMaterialId !== undefined && selectedQuantity !== null && selectedQuantity > 0) {
      const existingIndex = currentComposition.findIndex(item => item.rawMaterialId === selectedRawMaterialId);
      if (existingIndex > -1) {
        message.warning('Esta materia prima ya está en la composición. Edite la cantidad o elimínela.');
      } else {
        setCurrentComposition(prev => [
          ...prev,
          { rawMaterialId: selectedRawMaterialId, quantity: selectedQuantity },
        ]);
      }
      setSelectedRawMaterialId(undefined);
      setSelectedQuantity(1);
    } else {
      message.error('Seleccione una materia prima y una cantidad válida (> 0).');
    }
  };

  const handleRemoveCompositionItem = (rawMaterialIdToRemove: number) => {
    setCurrentComposition(prev => prev.filter(item => item.rawMaterialId !== rawMaterialIdToRemove));
  };

  // --- Definición de Pasos --- 
  const steps = [
    {
      title: 'Información Básica',
      content: 'step1-content', // Usaremos esto como clave para renderizado condicional
    },
    {
      title: 'Composición',
      content: 'step2-content',
    },
  ];

  // --- Funciones Navegación Steps ---
  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        // Validar solo los campos del paso 1
        await form.validateFields(['name', 'code', 'size', 'color', 'sellingPrice']); // Añadir otros si son requeridos
        setCurrentStep(prev => prev + 1);
      } catch (errorInfo) {
        console.log('Validation Failed:', errorInfo);
        message.warning('Por favor, complete los campos requeridos del paso actual.');
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

  // Definición de columnas para la tabla de Productos
  const columns: ColumnsType<Product> = [
    { 
      title: 'Código', 
      dataIndex: 'code', 
      key: 'code',
      ...getColumnSearchProps('code') 
    },
    { 
      title: 'Nombre', 
      dataIndex: 'name', 
      key: 'name', 
      sorter: (a: Product, b: Product) => a.name.localeCompare(b.name),
      ...getColumnSearchProps('name') 
    },
     { 
      title: 'Talla', 
      dataIndex: 'size', 
      key: 'size',
      ...getColumnSearchProps('size') 
    },
     { 
      title: 'Color', 
      dataIndex: 'color', 
      key: 'color',
      ...getColumnSearchProps('color') 
    },
     { 
      title: 'Stock', 
      dataIndex: 'stock', 
      key: 'stock',
      sorter: (a: Product, b: Product) => a.stock - b.stock,
      align: 'right' // Alinear stock a la derecha
    },
    {
      title: 'P. Venta', 
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      sorter: (a: Product, b: Product) => a.sellingPrice - b.sellingPrice,
      align: 'right',
      render: (price: number) => `S/ ${Number(price).toFixed(2)}` // Formatear en render
    },
    {
      title: 'Acciones',
      key: 'actions',
      align: 'center',
      render: (text: unknown, record: Product) => (
        <Space size="middle">
          <Button type="link" icon={<EyeOutlined />} onClick={() => handleView(record)} />
          <Button type="link" icon={<EditOutlined />} onClick={() => handleEdit(record)} />
          <Popconfirm
            title="¿Estás seguro de eliminar este producto?"
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
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={2}>Gestión de Productos</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Nuevo Producto
        </Button>
      </Space>

      <Table columns={columns} dataSource={products} rowKey="id" loading={loading} />

      {/* Modal de Edición/Creación */}
      <Modal
        title={editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
        open={isModalVisible}
        onCancel={handleCancelModal}
        confirmLoading={isSubmitting}
        width={700}
        destroyOnClose
        footer={(
          <div style={{ textAlign: 'right' }}>
            {currentStep > 0 && (
              <Button style={{ margin: '0 8px' }} onClick={handlePrev}>
                Anterior
              </Button>
            )}
            {currentStep < steps.length - 1 && (
              <Button type="primary" onClick={handleNext}>
                Siguiente
              </Button>
            )}
            {currentStep === steps.length - 1 && (
              <Button type="primary" loading={isSubmitting} onClick={handleModalSubmit}>
                {editingProduct ? 'Actualizar' : 'Crear'} Producto
              </Button>
            )}
            <Button key="cancel" onClick={handleCancelModal} style={{ marginLeft: 8 }}>
              Cancelar
            </Button>
          </div>
        )}
      >
        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />
        
        <Form form={form} layout="vertical" name="productForm">
          
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <Form.Item name="name" label="Nombre Producto/Modelo" rules={[{ required: true, message: 'Nombre es requerido' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="code" label="Código (SKU)" rules={[{ required: true, message: 'Código es requerido' }]}>
              <Input />
            </Form.Item>
             <Form.Item name="description" label="Descripción">
              <Input.TextArea rows={2} />
            </Form.Item>
            <Space>
              <Form.Item name="size" label="Talla" rules={[{ required: true, message: 'Talla es requerida' }]}>
                <Input style={{ width: '100px'}} />
              </Form.Item>
              <Form.Item name="color" label="Color" rules={[{ required: true, message: 'Color es requerido' }]}>
                 <Input style={{ width: '150px'}} />
              </Form.Item>
              <Form.Item name="stock" label="Stock Inicial" initialValue={0}>
                 <InputNumber min={0} style={{ width: '100px'}}/>
              </Form.Item>
            </Space>
            <Space>
              <Form.Item name="purchasePrice" label="Precio de Costo (S/)">
                 <InputNumber min={0} step={0.1} style={{ width: '150px'}} addonBefore="S/" placeholder="Opcional" />
              </Form.Item>
              <Form.Item name="sellingPrice" label="Precio de Venta (S/)" rules={[{ required: true, message: 'Precio de venta es requerido' }]}>
                <InputNumber min={0} step={0.1} style={{ width: '150px' }} addonBefore="S/" />
              </Form.Item>
            </Space>
          </div>

          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <Space align="baseline" wrap style={{ marginBottom: '16px'}}>
              <Select<number | undefined>
                style={{ width: 250 }}
                placeholder="Seleccionar Materia Prima"
                value={selectedRawMaterialId}
                onChange={(value: number | undefined) => setSelectedRawMaterialId(value)}
                showSearch
                optionFilterProp="label"
                filterOption={(input: string, option?: { label: string; value: number }) => 
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
                loading={loading}
                options={availableRawMaterials.map(rm => ({ 
                  value: rm.id,
                  label: `${rm.name} (${rm.unit})` 
                }))}
              />
              <InputNumber 
                 placeholder="Cantidad"
                 min={0.001}
                 step={0.1}
                 style={{ width: 120 }}
                 value={selectedQuantity}
                 onChange={(value: number | null) => setSelectedQuantity(value)}
               />
              <Button type="dashed" onClick={handleAddCompositionItem} icon={<PlusOutlined />}>
                Añadir a Composición
              </Button>
            </Space>
            <List
              header={<div><strong>Materias Primas Añadidas:</strong></div>}
              bordered
              dataSource={currentComposition}
              locale={{ emptyText: 'Aún no hay materias primas en la composición.' }}
              renderItem={item => {
                const rawMaterial = availableRawMaterials.find(rm => rm.id === item.rawMaterialId);
                return (
                  <List.Item
                    actions={[
                      <Button 
                        type="link" 
                        danger 
                        icon={<DeleteOutlined />} 
                        onClick={() => handleRemoveCompositionItem(item.rawMaterialId)}
                      />
                    ]}
                  >
                    <List.Item.Meta
                      title={rawMaterial?.name || `ID: ${item.rawMaterialId}`}
                      description={`Unidad: ${rawMaterial?.unit || 'N/A'}`}
                    />
                    <div>Cantidad: {item.quantity.toFixed(3)}</div> 
                  </List.Item>
                );
              }}
              style={{ maxHeight: '250px', overflowY: 'auto'}}
            />
          </div>

        </Form>
      </Modal>

      {/* Modal de Visualización */}
      <Modal
        title={`Detalles del Producto: ${viewingProduct?.name}`}
        open={isViewModalVisible}
        onCancel={() => setIsViewModalVisible(false)}
        footer={[
          <Button key="back" onClick={() => setIsViewModalVisible(false)}>
            Cerrar
          </Button>,
        ]}
      >
        {viewingProduct && (
          <div>
            <p><strong>ID:</strong> {viewingProduct.id}</p>
            <p><strong>Nombre:</strong> {viewingProduct.name}</p>
            <p><strong>Código:</strong> {viewingProduct.code}</p>
            <p><strong>Descripción:</strong> {viewingProduct.description || '-'}</p>
            <p><strong>Talla:</strong> {viewingProduct.size}</p>
            <p><strong>Color:</strong> {viewingProduct.color}</p>
            <p><strong>Stock:</strong> {viewingProduct.stock}</p>
            <p><strong>Precio Costo:</strong> {viewingProduct.purchasePrice ? `S/ ${Number(viewingProduct.purchasePrice).toFixed(2)}` : '-'}</p>
            <p><strong>Precio Venta:</strong> {`S/ ${Number(viewingProduct.sellingPrice).toFixed(2)}`}</p>
            <p><strong>Creado:</strong> {viewingProduct.createdAt ? new Date(viewingProduct.createdAt).toLocaleString() : '-'}</p>
            <p><strong>Actualizado:</strong> {viewingProduct.updatedAt ? new Date(viewingProduct.updatedAt).toLocaleString() : '-'}</p>
            <Title level={5} style={{ marginTop: '16px' }}>Composición:</Title>
            {viewingProduct.composition && viewingProduct.composition.length > 0 ? (
              <ul>
                {viewingProduct.composition.map(item => (
                  <li key={item.id}> {/* Asumiendo que item.id es el ID de ProductComposition */}
                    {item.rawMaterial?.name || `ID: ${item.rawMaterialId}`} - Cantidad: {Number(item.quantity).toFixed(3)}
                  </li>
                ))}
              </ul>
            ) : (
              <p>Este producto no tiene composición definida.</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default ProductsPage; 