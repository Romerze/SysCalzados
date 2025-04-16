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
  InputNumber,
  InputRef,
  List,
  Select,
  Steps,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { FilterConfirmProps, FilterDropdownProps } from 'antd/es/table/interface';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  MinusCircleOutlined,
} from '@ant-design/icons';
import { Product, RawMaterial, ProductModelView } from '../types/models';
import {
  getProducts, deleteProduct, createProduct,
  getRawMaterials,
  updateProduct,
} from '../services/api';
import axios from 'axios';
import Highlighter from 'react-highlight-words';
import { UpdateProductPayload } from '../services/api';
import EditProductModal from '../components/EditProductModal';

const { Title } = Typography;

type CompositionItemPayload = {
  rawMaterialId: number;
  quantity: number;
};
type CreateProductPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'composition' | 'code'> & {
  composition?: CompositionItemPayload[];
};

// Define interface for variant form data
interface VariantFormData {
  size: string;
  color: string;
  code: string;
  sellingPrice: number | null;
  purchasePrice?: number | null;
  stock: number;
}

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<ProductModelView[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [searchedColumn, setSearchedColumn] = useState('');
  const searchInput = useRef<InputRef>(null);
  const [availableRawMaterials, setAvailableRawMaterials] = useState<RawMaterial[]>([]); 
  const [currentComposition, setCurrentComposition] = useState<CompositionItemPayload[]>([]); 
  const [selectedRawMaterialId, setSelectedRawMaterialId] = useState<number | undefined>(undefined);
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(1);
  const [currentStep, setCurrentStep] = useState(0);

  // Add state for the Edit Modal
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [form] = Form.useForm();
  const [modal, contextHolder] = Modal.useModal();

  // Simplify handleSearch - it only needs the string value
  const handleSearch = (
    selectedKeys: string[],
    confirm: (param?: FilterConfirmProps) => void,
    dataIndex: string, // Expect string dataIndex here
  ) => {
    confirm();
    setSearchText(selectedKeys[0]);
    setSearchedColumn(dataIndex); // Set string directly
  };

  const handleReset = (clearFilters: () => void) => {
    clearFilters();
    setSearchText('');
  };

  // Change generic constraint to be more specific
  const getColumnSearchProps = <T extends ProductModelView | Product>(dataIndex: keyof T): ColumnsType<T>[number] => ({
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }: FilterDropdownProps) => (
      <div style={{ padding: 8 }} onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => e.stopPropagation()}>
        <Input
          ref={searchInput}
          placeholder={`Buscar por ${String(dataIndex)}`}
          value={selectedKeys[0]}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => handleSearch(selectedKeys as string[], confirm, String(dataIndex))}
          style={{ marginBottom: 8, display: 'block' }}
        />
        <Space>
          <Button
            type="primary"
            onClick={() => handleSearch(selectedKeys as string[], confirm, String(dataIndex))}
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
    onFilter: (value: React.Key | boolean, record: T) => {
        if (typeof value === 'boolean') {
            return true; 
        }
        const recordValue = record[dataIndex];
        const recordValueString = recordValue !== null && recordValue !== undefined ? String(recordValue) : '';
        return recordValueString.toLowerCase().includes(String(value).toLowerCase());
    },      
    onFilterDropdownOpenChange: (visible: boolean) => { 
      if (visible) {
        setTimeout(() => searchInput.current?.select(), 100);
      }
    },
  }) as ColumnsType<T>[number]; // Assert as a single column type element

  const fetchData = async () => {
    setLoading(true);
    try {
      const [productsData, rawMaterialsData] = await Promise.all([
        getProducts(),
        getRawMaterials(),
      ]);

      // Group products by name to create model views
      const groupedProducts = productsData.reduce((acc, product) => {
        const modelName = product.name; // Group by name
        if (!acc[modelName]) {
          acc[modelName] = {
            key: modelName, // Use name as key for simplicity
            name: modelName,
            description: product.description, // Assume description is same for model
            variants: [],
          };
        }
        acc[modelName].variants.push(product);
        return acc;
      }, {} as Record<string, ProductModelView>);

      // Convert grouped object back to an array for the table
      const modelViewData = Object.values(groupedProducts);

      setProducts(modelViewData); // Now products state holds ProductModelView[]
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

  const handleAdd = () => {
    form.resetFields();
    setCurrentComposition([]);
    setSelectedRawMaterialId(undefined);
    setSelectedQuantity(1);
    setCurrentStep(0);
    setIsModalVisible(true);
  };

  // --- Implement Edit Logic --- 
  const handleEdit = (variantToEdit: Product) => {
    if (!variantToEdit) {
      message.error('Error: No se proporcionó información del producto para editar.');
      return;
    }
    console.log("Editing Product:", variantToEdit); // Debug log
    setEditingProduct(variantToEdit); 
    setIsEditModalVisible(true); 
  };

  const handleCloseEditModal = () => {
    setIsEditModalVisible(false);
    setEditingProduct(null); // Clear editing state on close
  };

  const handleFinishEdit = async (id: number, values: UpdateProductPayload) => {
    const actionKey = `updateProd-${id}`;
    setIsEditSubmitting(true);
    message.loading({ content: 'Actualizando variante...', key: actionKey });
    try {
      await updateProduct(id, values);
      message.success({ content: 'Variante actualizada correctamente', key: actionKey });
      handleCloseEditModal(); // Close modal on success
      fetchData(); // Refresh data
    } catch (error) {
        message.destroy(actionKey);
        console.error(`Error updating product ${id}:`, error);
        let errorMsg = 'Error al actualizar la variante.';
        if (axios.isAxiosError(error) && error.response?.data?.message) {
            errorMsg = Array.isArray(error.response.data.message) 
                        ? error.response.data.message.join('; ') 
                        : error.response.data.message;
        }
        modal.error({ title: 'Error al Actualizar', content: errorMsg });
    } finally {
      setIsEditSubmitting(false);
    }
  };
  // --- End Edit Logic --- 

  const handleCancelModal = () => {
    setIsModalVisible(false);
    form.resetFields();
    setCurrentComposition([]);
    setCurrentStep(0);
  };

  const handleDelete = (id: number) => {
    modal.confirm({
      title: '¿Estás seguro de eliminar este producto?',
      content: 'Esta acción no se puede deshacer.',
      okText: 'Sí, eliminar',
      okType: 'danger',
      cancelText: 'No, cancelar',
      onOk: async () => {
        try {
          await deleteProduct(id);
          message.success('Producto eliminado con éxito');
          fetchData();
        } catch (error) {
          console.error("Error deleting product:", error);
          message.error('Error al eliminar el producto');
        }
      },
    });
  };

  const handleModalSubmit = async () => {
    const actionKey = 'createMultiple';
    try {
      const values = await form.validateFields(); 
      
      if (currentComposition.length === 0) {
        message.error({ content: 'Debe añadir al menos una materia prima a la composición.', key: actionKey });
        return;
      }

      setIsSubmitting(true);
      message.loading({ content: 'Creando variantes...', key: actionKey });

      const { name, description, variants } = values;

      const creationPromises = variants.map((variant: VariantFormData) => {
        const payloadForVariant: CreateProductPayload = {
          name: name,
          description: description,
          size: variant.size,
          color: variant.color,
          stock: Number(variant.stock ?? 0),
          sellingPrice: Number(variant.sellingPrice),
          purchasePrice: variant.purchasePrice ? Number(variant.purchasePrice) : undefined,
          composition: currentComposition,
        };
        return createProduct(payloadForVariant);
      });

      await Promise.all(creationPromises);

      message.success({ content: `Se crearon ${variants.length} variantes del producto`, key: actionKey, duration: 3 });
      
      setIsModalVisible(false);
      setCurrentComposition([]);
      setCurrentStep(0);
      form.resetFields();
      fetchData();

    } catch (error: unknown) {
      console.error('Form submission error:', error);
      let errorMessage = 'Error al crear variantes';
      if (axios.isAxiosError(error) && error.response?.data) {
        if (error.response.status === 409 && error.response.data.message) {
          errorMessage = error.response.data.message;
        } else if (error.response.data.message) {
          if (Array.isArray(error.response.data.message)) {
            errorMessage = error.response.data.message.join('; '); 
          } else {
             errorMessage = error.response.data.message;
          }
        } else if (error.response.data.error) {
             errorMessage = `Error del servidor: ${error.response.data.error}`;
        }
      } else if (typeof error === 'object' && error !== null && 'errorFields' in error) { 
         errorMessage = "Error de validación en el formulario. Revise los campos.";
      } 
      message.error({ content: errorMessage, key: actionKey + '_error', duration: 5 });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNext = async () => {
    if (currentStep === 0) {
      try {
        await form.validateFields(['name', 'code']);
        setCurrentStep(prev => prev + 1);
      } catch (errorInfo) {
        console.log('Validation Failed (Step 0):', errorInfo);
        message.warning('Por favor, complete los campos requeridos del modelo base.');
      }
    } else if (currentStep === 1) {
      try {
        await form.validateFields(['variants']); 
        const variants = form.getFieldValue('variants') || [];
        if (variants.length === 0) {
           message.warning('Debe añadir al menos una variante de producto.');
           return;
        }
        // Use the defined interface for variants
        const hasIncompleteVariant = variants.some((variant: VariantFormData | undefined | null) => 
          !variant || !variant.size || !variant.color /* || !variant.code */ || variant.sellingPrice === null || variant.sellingPrice === undefined
        );
        if (hasIncompleteVariant) {
           message.warning('Por favor, complete todos los campos requeridos para cada variante.');
           return;
        }
        setCurrentStep(prev => prev + 1);
      } catch (errorInfo) {
        console.log('Validation Failed (Step 1):', errorInfo);
        if (errorInfo && typeof errorInfo === 'object' && 'errorFields' in errorInfo) {
            const validationError = errorInfo as { errorFields: { name: (string | number)[] }[] }; 
            if (Array.isArray(validationError.errorFields)) {
              const variantErrors = validationError.errorFields.filter((field: { name: (string | number)[] }) => 
                Array.isArray(field.name) && field.name[0] === 'variants'
              );
              if (variantErrors.length > 0) {
                   message.warning('Por favor, corrija los errores en las variantes.');
                   return;
              }
            }
        }
        message.warning('Error al validar variantes.');
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep(prev => prev - 1);
  };

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

  const steps = [
    {
      title: 'Modelo',
      content: 'step0-content',
    },
    {
      title: 'Variantes',
      content: 'step1-content',
    },
    {
      title: 'Composición',
      content: 'step2-content',
    },
  ];

  // Add Highlighter logic specifically where needed
  const renderHighlightedText = (text: string | number | undefined | null) => {
      const textString = text ? String(text) : '';
      return searchedColumn === 'name' || searchedColumn === 'description' || searchedColumn === 'key' || searchedColumn === 'code' || searchedColumn === 'size' || searchedColumn === 'color' ? (
          <Highlighter
              highlightStyle={{ backgroundColor: '#ffc069', padding: 0 }}
              searchWords={[searchText]}
              autoEscape
              textToHighlight={textString}
          />
      ) : (
          textString || '-'
      );
  };

  const columns: ColumnsType<ProductModelView> = [
    { 
      title: 'Código', 
      dataIndex: 'key', 
      key: 'key',
      ...getColumnSearchProps<ProductModelView>('key'),
      render: (text) => renderHighlightedText(text) // Apply highlighter here
    },
    { 
      title: 'Nombre', 
      dataIndex: 'name', 
      key: 'name', 
      sorter: (a: ProductModelView, b: ProductModelView) => a.name.localeCompare(b.name),
      ...getColumnSearchProps<ProductModelView>('name'),
      render: (text) => renderHighlightedText(text) // Apply highlighter here
    },
     { 
      title: 'Descripción', 
      dataIndex: 'description', 
      key: 'description',
      ...getColumnSearchProps<ProductModelView>('description'),
      render: (text) => renderHighlightedText(text) // Apply highlighter here
    },
    {
      title: 'Nº Variantes',
      dataIndex: 'variants',
      key: 'numVariants',
      align: 'center',
      render: (variants: Product[]) => variants.length,
    },
    {
      title: 'Acciones',
      key: 'actions',
      align: 'center',
      render: (text: unknown, record: ProductModelView) => (
        <Space size="middle">
          <Button type="link" icon={<EditOutlined />} disabled title="Edición a nivel de modelo no implementada" />
          <Popconfirm
            title={`¿Eliminar el modelo '${record.name}' y todas sus ${record.variants.length} variantes?`}
            onConfirm={() => handleDeleteModel(record)}
            okText="Sí, eliminar todo"
            cancelText="No"
            disabled
          >
            <Button type="link" danger icon={<DeleteOutlined />} disabled />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Define columns for the nested variants table
  const variantColumns: ColumnsType<Product> = [
    { title: 'SKU', dataIndex: 'code', key: 'code', ...getColumnSearchProps<Product>('code'), render: (text) => renderHighlightedText(text) }, // Apply highlighter
    { title: 'Talla', dataIndex: 'size', key: 'size', ...getColumnSearchProps<Product>('size'), render: (text) => renderHighlightedText(text) }, // Apply highlighter
    { title: 'Color', dataIndex: 'color', key: 'color', ...getColumnSearchProps<Product>('color'), render: (text) => renderHighlightedText(text) }, // Apply highlighter
    { title: 'Stock', dataIndex: 'stock', key: 'stock', align: 'right' }, // No highlight needed
    {
      title: 'P. Venta',
      dataIndex: 'sellingPrice',
      key: 'sellingPrice',
      align: 'right',
      render: (price: number) => `S/ ${Number(price).toFixed(2)}`,
    },
    {
      title: 'P. Costo',
      dataIndex: 'purchasePrice',
      key: 'purchasePrice',
      align: 'right',
      render: (price: number | null) => price ? `S/ ${Number(price).toFixed(2)}` : '-',
    },
    {
      title: 'Acciones Variante',
      key: 'variantActions',
      align: 'center',
      render: (text: unknown, record: Product) => (
        <Space size="small"> 
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => handleEdit(record)} title="Editar esta variante"/>
          <Popconfirm
            title="¿Eliminar esta variante específica?"
            onConfirm={() => handleDelete(record.id)}
            okText="Sí"
            cancelText="No"
          >
            <Button type="link" size="small" danger icon={<DeleteOutlined />} title="Eliminar esta variante"/>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Define the expanded row render function
  const expandedRowRender = (record: ProductModelView) => {
    return (
      <Table
        columns={variantColumns}
        dataSource={record.variants}
        rowKey="id"
        pagination={false}
        size="small"
      />
    );
  };

  // Placeholder for deleting a whole model
  const handleDeleteModel = async (model: ProductModelView) => {
    console.log("Deleting model and variants (not implemented):", model);
    message.info("La eliminación de modelos completos aún no está implementada.");
    // Implementation would involve:
    // 1. Confirming with the user
    // 2. Getting all variant IDs: model.variants.map(v => v.id)
    // 3. Calling deleteProduct for each ID (maybe Promise.all)
    // 4. Refetching data
  };

  return (
    <div>
      {contextHolder}
      <Space style={{ marginBottom: 16, width: '100%', justifyContent: 'space-between' }}>
        <Title level={2}>Gestión de Productos</Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleAdd}>
          Nuevo Producto
        </Button>
      </Space>

      <Table 
        columns={columns}
        dataSource={products}
        rowKey="key"
        loading={loading} 
        expandable={{ expandedRowRender }}
      />

      <Modal
        title="Nuevo Producto"
        open={isModalVisible}
        onCancel={handleCancelModal}
        confirmLoading={isSubmitting}
        width={800}
        destroyOnClose
        footer={
          <div style={{ marginTop: 24 }}>
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
                 Crear Producto
              </Button>
            )}
          </div>
        }
      >
        <Steps current={currentStep} items={steps} style={{ marginBottom: 24 }} />
        
        <Form form={form} layout="vertical" name="productForm">
          
          <div style={{ display: currentStep === 0 ? 'block' : 'none' }}>
            <Title level={5} style={{ marginBottom: 16 }}>Datos del Modelo Base</Title>
            <Form.Item name="name" label="Nombre Modelo" rules={[{ required: true, message: 'Nombre del modelo es requerido' }]}>
              <Input />
            </Form.Item>
            <Form.Item name="code" label="Código Base Modelo" rules={[{ required: true, message: 'Código base es requerido' }]}>
              <Input />
            </Form.Item>
             <Form.Item name="description" label="Descripción">
              <Input.TextArea rows={2} />
            </Form.Item>
          </div>

          <div style={{ display: currentStep === 1 ? 'block' : 'none' }}>
            <Title level={5} style={{ marginBottom: 16 }}>Variantes del Producto (Talla/Color)</Title>
            <Form.List name="variants" initialValue={[{ size: '', color: '', code: '', sellingPrice: null, purchasePrice: null, stock: 0 }]}>
              {(fields, { add, remove }) => (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', rowGap: 16 }}>
                    {fields.map(({ key, name, ...restField }) => (
                      <Space key={key} style={{ display: 'flex', alignItems: 'baseline' }} align="baseline">
                        <Form.Item
                          {...restField}
                          name={[name, 'size']}
                          label="Talla"
                          rules={[{ required: true, message: 'Falta talla' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="Ej: 40" style={{ width: '80px' }} />
                        </Form.Item>
                        <Form.Item
                          {...restField}
                          name={[name, 'color']}
                          label="Color"
                          rules={[{ required: true, message: 'Falta color' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <Input placeholder="Ej: Azul" style={{ width: '120px' }} />
                        </Form.Item>
                         <Form.Item
                          {...restField}
                          name={[name, 'sellingPrice']}
                          label="P. Venta"
                          rules={[{ required: true, message: 'Falta precio venta' }]}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber addonBefore="S/" min={0} step={0.1} placeholder="150.00" style={{ width: '130px' }}/>
                        </Form.Item>
                         <Form.Item
                          {...restField}
                          name={[name, 'purchasePrice']}
                          label="P. Costo"
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber addonBefore="S/" min={0} step={0.1} placeholder="Opcional" style={{ width: '130px' }}/>
                        </Form.Item>
                         <Form.Item
                          {...restField}
                          name={[name, 'stock']}
                          label="Stock Inicial"
                          initialValue={0}
                          style={{ marginBottom: 0 }}
                        >
                          <InputNumber min={0} style={{ width: '90px' }}/>
                        </Form.Item>

                        <MinusCircleOutlined onClick={() => remove(name)} />
                      </Space>
                    ))}
                  </div>
                  <Form.Item>
                    <Button type="dashed" onClick={() => add()} block icon={<PlusOutlined />}>
                      Añadir Variante (Talla/Color)
                    </Button>
                  </Form.Item>
                </>
              )}
            </Form.List>
          </div>

          <div style={{ display: currentStep === 2 ? 'block' : 'none' }}>
            <Title level={5} style={{ marginBottom: 16 }}>Composición del Modelo</Title>
            <Space align="baseline" wrap style={{ marginBottom: '16px'}}>
              <Select<number | undefined>
                 style={{ width: 250 }}
                 placeholder="Seleccionar Materia Prima"
                 value={selectedRawMaterialId}
                 onChange={(value) => setSelectedRawMaterialId(value)}
                 showSearch
                 optionFilterProp="label"
                 filterOption={(input, option) => 
                    (typeof option?.label === 'string' ? option.label : '').toLowerCase().includes(input.toLowerCase())
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
                 style={{ maxHeight: '200px', overflowY: 'auto', marginBottom: 24 }}
                 header={<div><strong>Materias Primas Añadidas:</strong></div>}
                 bordered
                 dataSource={currentComposition}
                 locale={{ emptyText: 'Aún no hay materias primas.' }}
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
              />
          </div>

        </Form>
      </Modal>

      {/* --- Add Edit Modal --- */}
      <EditProductModal 
         visible={isEditModalVisible}
         product={editingProduct}
         onClose={handleCloseEditModal}
         onFinish={handleFinishEdit}
         loading={isEditSubmitting}
      />
    </div>
  );
};

export default ProductsPage; 