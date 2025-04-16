import React, { useEffect } from 'react';
import {
  Modal,
  Form,
  Input,
  InputNumber,
  Button,
  message,
  Spin,
  Row,
  Col,
} from 'antd';
import { Product } from '../types/models'; // Assuming types are here
import { UpdateProductPayload } from '../services/api'; // Assuming payload type is here

interface EditProductModalProps {
  visible: boolean;
  product: Product | null;
  onClose: () => void;
  onFinish: (id: number, values: UpdateProductPayload) => Promise<void>;
  loading?: boolean; // Optional loading state for submit button
}

const EditProductModal: React.FC<EditProductModalProps> = ({
  visible,
  product,
  onClose,
  onFinish,
  loading = false,
}) => {
  const [form] = Form.useForm<UpdateProductPayload>();

  useEffect(() => {
    if (product) {
      // Populate form ensuring numeric types for InputNumber fields
      form.setFieldsValue({
        name: product.name, 
        description: product.description, 
        code: product.code,
        size: product.size,
        color: product.color,
        // Convert null to undefined for price fields to match UpdateProductPayload type
        sellingPrice: product.sellingPrice !== null && product.sellingPrice !== undefined 
                      ? Number(product.sellingPrice) 
                      : undefined, // Use undefined instead of null
        purchasePrice: product.purchasePrice !== null && product.purchasePrice !== undefined 
                       ? Number(product.purchasePrice) 
                       : undefined, // Use undefined instead of null
        stock: product.stock !== null && product.stock !== undefined 
               ? Number(product.stock) 
               : 0, // Default stock to 0 if null/undefined
      });
    } else {
      form.resetFields();
    }
  }, [product, form, visible]); // Re-populate if product or visibility changes

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (product) {
        // Prepare payload (only send changed editable fields)
        // Note: TypeORM patch usually handles partial updates well
        const payload: UpdateProductPayload = {
            code: values.code,
            size: values.size,
            color: values.color,
            sellingPrice: values.sellingPrice,
            purchasePrice: values.purchasePrice,
            stock: values.stock,
            // We are NOT sending name, description, or composition
        };
        await onFinish(product.id, payload);
      } else {
        message.error("No hay producto seleccionado para editar.");
      }
    } catch (errorInfo) {
      console.error('Validation Failed:', errorInfo);
      message.error('Por favor, complete los campos requeridos.');
    }
  };

  return (
    <Modal
      title={`Editar Variante de Producto: ${product?.name ?? ''} (${product?.code ?? 'N/A'})`}
      open={visible}
      onCancel={onClose}
      confirmLoading={loading}
      destroyOnClose // Reset form state when modal closes
      footer={[
        <Button key="back" onClick={onClose} disabled={loading}>
          Cancelar
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleOk}>
          Actualizar Variante
        </Button>,
      ]}
    >
      {product ? (
        <Form form={form} layout="vertical" name="editProductVariantForm">
          <Form.Item name="name" label="Nombre Modelo (Solo lectura)">
            <Input readOnly disabled />
          </Form.Item>
          <Form.Item name="description" label="Descripción Modelo (Solo lectura)">
            <Input.TextArea rows={2} readOnly disabled />
          </Form.Item>
          
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item 
                name="code" 
                label="Código Variante (Automático)"
              >
                <Input readOnly disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
               <Form.Item 
                 name="size" 
                 label="Talla" 
                 rules={[{ required: true, message: 'Ingrese la talla' }]}
               >
                 <Input />
               </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
             <Col span={12}>
               <Form.Item 
                 name="color" 
                 label="Color" 
                 rules={[{ required: true, message: 'Ingrese el color' }]}
               >
                 <Input />
               </Form.Item>
             </Col>
             <Col span={12}>
                <Form.Item 
                  name="sellingPrice" 
                  label="Precio Venta (S/)" 
                  rules={[{ required: true, message: 'Ingrese precio' }, { type: 'number', min: 0, message: '>= 0' }]}
                >
                  <InputNumber style={{ width: '100%' }} min={0} precision={2} />
                </Form.Item>
             </Col>
           </Row>

           <Row gutter={16}>
             <Col span={12}>
               <Form.Item 
                 name="purchasePrice" 
                 label="Precio Compra (S/) (Opc.)" 
                 rules={[{ type: 'number', min: 0, message: '>= 0' }]} 
               >
                 <InputNumber style={{ width: '100%' }} min={0} precision={2} />
               </Form.Item>
             </Col>
             <Col span={12}>
               <Form.Item 
                 name="stock" 
                 label="Stock Actual" 
                 rules={[{ required: true, message: 'Ingrese stock' }, { type: 'integer', min: 0, message: '>= 0' }]}
               >
                 <InputNumber style={{ width: '100%' }} min={0} step={1} />
               </Form.Item>
             </Col>
           </Row>

        </Form>
      ) : (
        <Spin tip="Cargando datos del producto..." />
      )}
    </Modal>
  );
};

export default EditProductModal; 