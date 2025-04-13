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