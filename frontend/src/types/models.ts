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