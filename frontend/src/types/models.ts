// Tipos para las entidades del backend

export interface User {
  id: number;
  email: string;
  // No incluimos password
}

export interface Supplier {
  id: number;
  name: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  // Añadir createdAt/updatedAt si se devuelven desde el backend
}

export interface RawMaterial {
  id: number;
  name: string;
  description?: string;
  unit: string;
  stock: number;
  supplierId?: number;
  supplier?: Supplier; // Incluir el objeto Supplier si se carga la relación
}

// Nueva interfaz para Cliente
export interface Client {
  id: number;
  firstName: string;
  lastName: string;
  dni: string; // Documento Nacional de Identidad
  phone?: string;
  email?: string;
  address?: string;
  // Añadir createdAt/updatedAt si se devuelven desde el backend
  // createdAt?: string;
  // updatedAt?: string;
}

// Interfaz para un item de la composición de un producto
export interface CompositionItem {
  id: number; // ID del registro ProductComposition
  rawMaterialId: number;
  quantity: number;
  rawMaterial?: RawMaterial; // Incluir datos de la materia prima cargada
}

// Nueva interfaz para Producto
export interface Product {
  id: number;
  name: string;
  code: string;
  description?: string;
  size: string;
  color: string;
  stock: number;
  purchasePrice?: number; // Opcional
  sellingPrice: number;
  createdAt?: string; // Asumiendo que el backend devuelve string en JSON
  updatedAt?: string; // Asumiendo que el backend devuelve string en JSON
  composition?: CompositionItem[]; // Añadir nueva relación
}

// Enum para Tipo de Movimiento de Stock (replicar del backend)
export enum MovementType {
  ENTRY = 'entry',
  EXIT = 'exit',
}

// Interfaz para Movimiento de Stock
export interface StockMovement {
  id: number;
  type: MovementType; // Usar el enum
  quantity: number; 
  date: string; // La API devolverá string ISO para fechas
  notes?: string;
  rawMaterialId: number;
  rawMaterial?: RawMaterial; // Para incluir datos básicos al listar
  stockAfterMovement?: number; // Stock resultante después del movimiento
}

// Enum para Estado de Orden de Producción
export enum ProductionOrderStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

// Interfaz para Orden de Producción
export interface ProductionOrder {
  id: number;
  orderNumber?: string; // Puede ser null si no se generó aún
  productId: number;
  product: Product; // Asumiendo que la API carga esto
  quantityToProduce: number;
  status: ProductionOrderStatus;
  notes?: string;
  createdAt: string; // ISO String
  startedAt?: string; // ISO String
  completedAt?: string; // ISO String
}

// --- Sales Orders ---

export enum SalesOrderStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  PROCESSING = 'PROCESSING',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

export interface SalesOrderItem {
  id: number;
  orderId: number;
  productId: number;
  product?: Product; // Producto cargado (opcional)
  quantity: number;
  unitPrice: number;
  // subtotal?: number; // Calculable en frontend si es necesario
}

export interface SalesOrder {
  id: number;
  orderNumber?: string;
  clientId: number;
  client?: Client; // Cliente cargado (opcional)
  orderDate: string; // ISO String
  status: SalesOrderStatus;
  items?: SalesOrderItem[]; // Items cargados (opcional)
  notes?: string;
  totalAmount?: number;
  createdAt: string; // ISO String
  updatedAt: string; // ISO String
}

// Interface for the grouped product model view (used in ProductsPage)
export interface ProductModelView {
  key: string; // Use name as key
  name: string;
  description?: string; 
  variants: Product[]; 
} 