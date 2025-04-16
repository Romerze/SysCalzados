import React from 'react';
import {
  Modal,
  Typography,
  Tag,
  Space,
  Divider,
  List,
  Button,
} from 'antd';
import { SalesOrder, SalesOrderStatus, SalesOrderItem } from '../types/models'; // Assuming types are in ../types
import { format } from 'date-fns';

const { Title, Text } = Typography;

// Helper to get status color (copied from SalesOrdersPage for now)
const getStatusColor = (status: SalesOrderStatus) => {
  switch (status) {
    case SalesOrderStatus.PENDING: return 'orange';
    case SalesOrderStatus.CONFIRMED: return 'blue';
    case SalesOrderStatus.PROCESSING: return 'processing';
    case SalesOrderStatus.SHIPPED: return 'purple';
    case SalesOrderStatus.DELIVERED: return 'success';
    case SalesOrderStatus.CANCELLED: return 'error';
    case SalesOrderStatus.REFUNDED: return 'default';
    default: return 'default';
  }
};

// Helper function to calculate item subtotal
const calculateItemSubtotal = (item: SalesOrderItem): number => {
    return Number(item.quantity) * Number(item.unitPrice);
}

interface ViewDetailsModalProps {
  visible: boolean;
  order: SalesOrder | null;
  onClose: () => void;
}

const ViewDetailsModal: React.FC<ViewDetailsModalProps> = ({ visible, order, onClose }) => {
  if (!order) {
    return null; // Don't render if no order is provided
  }

  const clientName = order.client 
    ? `${order.client.firstName} ${order.client.lastName}` 
    : `ID ${order.clientId}`;

  return (
    <Modal
      title={`Detalles del Pedido #${order.orderNumber || order.id}`}
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>
          Cerrar
        </Button>,
      ]}
    >
      <Space direction="vertical" style={{ width: '100%' }}>
        <p><strong>Cliente:</strong> {clientName}</p>
        <p><strong>Fecha Pedido:</strong> {format(new Date(order.orderDate), 'dd/MM/yyyy HH:mm')}</p>
        <p><strong>Estado:</strong> <Tag color={getStatusColor(order.status)}>{order.status}</Tag></p>
        {order.notes && <p><strong>Notas:</strong> {order.notes}</p>}
        <Divider>Ítems</Divider>
        <List
          dataSource={order.items || []}
          size="small"
          renderItem={(item) => {
              const productName = item.product?.name || `Producto ID ${item.productId}`;
              const unitPrice = Number(item.unitPrice).toFixed(2);
              const quantity = Number(item.quantity);
              const subtotal = calculateItemSubtotal(item).toFixed(2);
              
              return (
                  <List.Item key={item.id}>
                     <List.Item.Meta
                        title={productName}
                        description={`Cantidad: ${quantity} | P.Unit: S/ ${unitPrice}`}
                     />
                     <div><Text strong>Subtotal: S/ {subtotal}</Text></div>
                   </List.Item>
              )
          }}
          locale={{ emptyText: 'Este pedido no tiene ítems.' }}
        />
         <Divider />
         <div style={{ textAlign: 'right' }}>
             <Title level={5}>Total Pedido: S/ {Number(order.totalAmount).toFixed(2) || '0.00'}</Title>
         </div>
      </Space>
    </Modal>
  );
};

export default ViewDetailsModal; 