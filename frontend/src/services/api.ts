import axios from 'axios';
import { LoginFormValues, RegisterFormValues } from '../types/formTypes';
import { Supplier, RawMaterial, Client, Product, StockMovement, MovementType, CompositionItem, ProductionOrder, ProductionOrderStatus, SalesOrder } from '../types/models'; // Importar tipo Supplier, RawMaterial, Client, Product, StockMovement, MovementType, CompositionItem, ProductionOrder, ProductionOrderStatus, SalesOrder

// Crear instancia de Axios con la URL base del backend
const apiClient = axios.create({
  baseURL: 'http://localhost:3000', // Asegúrate que este sea el puerto de tu backend NestJS
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Tipos de Respuesta Esperados (Podemos refinarlos) ---
interface LoginResponse {
  access_token: string;
}

interface RegisterResponse {
  // El endpoint de registro devuelve el usuario creado
  id: number;
  email: string;
  // No debería devolver la contraseña
}

// --- Tipos para DTOs (Simplificados) ---
type CreateSupplierPayload = Omit<Supplier, 'id'>;
type UpdateSupplierPayload = Partial<CreateSupplierPayload>;
// Tipos para RawMaterial DTOs
type CreateRawMaterialPayload = Omit<RawMaterial, 'id' | 'supplier'>; // Excluir id y objeto supplier
type UpdateRawMaterialPayload = Partial<CreateRawMaterialPayload>;

// Tipos para Client DTOs
type CreateClientPayload = Omit<Client, 'id'>; 
type UpdateClientPayload = Partial<CreateClientPayload>;

// Tipo auxiliar para el payload de composición
type CompositionItemPayload = Omit<CompositionItem, 'id' | 'rawMaterial'>; // Solo enviar id y quantity

// Tipos para Product DTOs
type CreateProductPayload = Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'composition'> & {
  composition?: CompositionItemPayload[];
};
// Ensure UpdateProductPayload is exported
export type UpdateProductPayload = Partial<CreateProductPayload & {
    // Explicitly include fields we allow updating via the dedicated modal
    code?: string;
    size?: string;
    color?: string;
    sellingPrice?: number | null;
    purchasePrice?: number | null;
    stock?: number;
    // Exclude name, description, composition for now
}>;

// Tipos para StockMovement DTOs
type CreateStockMovementPayload = {
  rawMaterialId: number;
  type: MovementType;
  quantity: number;
  notes?: string;
};

// Tipos para Production Order DTOs
type CreateProductionOrderPayload = {
  productId: number;
  quantityToProduce: number;
  orderNumber?: string;
  notes?: string;
};
type UpdateProductionOrderPayload = { // Para cambiar estado o notas
  status?: ProductionOrderStatus;
  notes?: string;
};

// Tipos para Sales Order DTOs - Add export
export type SalesOrderItemPayload = {
  productId: number;
  quantity: number;
  unitPrice: number;
};

export type CreateSalesOrderPayload = {
  clientId: number;
  items: SalesOrderItemPayload[];
  notes?: string;
};

export type UpdateSalesOrderPayload = {
  status?: string; // Keep string type for simplicity in API layer
  notes?: string;
  items?: SalesOrderItemPayload[]; // Add optional items array
};

// New Payload for updating only notes
export type UpdateSalesOrderNotesPayload = {
  notes?: string | null;
};

// --- Funciones del Servicio API ---

export const registerUser = async (
  userData: Omit<RegisterFormValues, 'confirm'> // Excluir 'confirm' ya que no se envía
): Promise<RegisterResponse> => {
  // El DTO del backend solo espera email y password
  const { email, password } = userData;
  const response = await apiClient.post<RegisterResponse>('/users/register', { email, password });
  return response.data;
};

export const loginUser = async (
  credentials: LoginFormValues
): Promise<LoginResponse> => {
  const response = await apiClient.post<LoginResponse>('/users/login', credentials);
  return response.data;
};

// --- Funciones API Suppliers --- 

export const getSuppliers = async (): Promise<Supplier[]> => {
  const response = await apiClient.get<Supplier[]>('/suppliers');
  return response.data;
};

export const createSupplier = async (supplierData: CreateSupplierPayload): Promise<Supplier> => {
  const response = await apiClient.post<Supplier>('/suppliers', supplierData);
  return response.data;
};

export const updateSupplier = async (id: number, supplierData: UpdateSupplierPayload): Promise<Supplier> => {
  const response = await apiClient.patch<Supplier>(`/suppliers/${id}`, supplierData);
  return response.data;
};

export const deleteSupplier = async (id: number): Promise<void> => {
  await apiClient.delete(`/suppliers/${id}`);
};

// --- Funciones API Raw Materials --- 

export const getRawMaterials = async (): Promise<RawMaterial[]> => {
  // Incluir ?_expand=supplier para cargar datos del proveedor si es necesario
  // const response = await apiClient.get<RawMaterial[]>('/raw-materials?_expand=supplier'); 
  const response = await apiClient.get<RawMaterial[]>('/raw-materials');
  return response.data;
};

export const createRawMaterial = async (rawData: CreateRawMaterialPayload): Promise<RawMaterial> => {
  const response = await apiClient.post<RawMaterial>('/raw-materials', rawData);
  return response.data;
};

export const updateRawMaterial = async (id: number, rawData: UpdateRawMaterialPayload): Promise<RawMaterial> => {
  const response = await apiClient.patch<RawMaterial>(`/raw-materials/${id}`, rawData);
  return response.data;
};

export const deleteRawMaterial = async (id: number): Promise<void> => {
  await apiClient.delete(`/raw-materials/${id}`);
};

// --- Funciones API Clients --- 

export const getClients = async (): Promise<Client[]> => {
  const response = await apiClient.get<Client[]>('/clients');
  return response.data;
};

export const createClient = async (clientData: CreateClientPayload): Promise<Client> => {
  const response = await apiClient.post<Client>('/clients', clientData);
  return response.data;
};

export const updateClient = async (id: number, clientData: UpdateClientPayload): Promise<Client> => {
  const response = await apiClient.patch<Client>(`/clients/${id}`, clientData);
  return response.data;
};

export const deleteClient = async (id: number): Promise<void> => {
  await apiClient.delete(`/clients/${id}`);
};

// --- Funciones API Products --- 

export const getProducts = async (): Promise<Product[]> => {
  const response = await apiClient.get<Product[]>('/products');
  return response.data;
};

export const createProduct = async (productData: CreateProductPayload): Promise<Product> => {
  const response = await apiClient.post<Product>('/products', productData);
  return response.data;
};

export const updateProduct = async (id: number, payload: UpdateProductPayload): Promise<Product> => {
  const response = await apiClient.patch<Product>(`/products/${id}`, payload);
  return response.data;
};

export const deleteProduct = async (id: number): Promise<void> => {
  await apiClient.delete(`/products/${id}`);
};

// Nueva función para obtener un producto con sus detalles (incluyendo relaciones)
export const getOneProduct = async (id: number): Promise<Product> => {
  const response = await apiClient.get<Product>(`/products/${id}`); 
  return response.data;
};

// --- Funciones API Stock Movements --- 

export const getStockMovements = async (rawMaterialId?: number): Promise<StockMovement[]> => {
  const params = rawMaterialId ? { rawMaterialId } : {};
  const response = await apiClient.get<StockMovement[]>('/stock-movements', { params });
  return response.data;
};

export const createStockMovement = async (movementData: CreateStockMovementPayload): Promise<StockMovement> => {
  const response = await apiClient.post<StockMovement>('/stock-movements', movementData);
  return response.data;
};

// --- Funciones API Production Orders --- 

export const getProductionOrders = async (): Promise<ProductionOrder[]> => {
  const response = await apiClient.get<ProductionOrder[]>('/production-orders');
  return response.data;
};

export const getOneProductionOrder = async (id: number): Promise<ProductionOrder> => {
  const response = await apiClient.get<ProductionOrder>(`/production-orders/${id}`);
  return response.data;
};

export const createProductionOrder = async (orderData: CreateProductionOrderPayload): Promise<ProductionOrder> => {
  const response = await apiClient.post<ProductionOrder>('/production-orders', orderData);
  return response.data;
};

// Función específica para actualizar estado/notas
export const updateProductionOrder = async (id: number, updateData: UpdateProductionOrderPayload): Promise<ProductionOrder> => {
  const response = await apiClient.patch<ProductionOrder>(`/production-orders/${id}`, updateData);
  return response.data;
};

export const deleteProductionOrder = async (id: number): Promise<void> => {
  await apiClient.delete(`/production-orders/${id}`);
};

// --- Funciones API Sales Orders ---

export const getSalesOrders = async (): Promise<SalesOrder[]> => {
  // Asumiremos que SalesOrder se añade a ../types/models
  const response = await apiClient.get<SalesOrder[]>('/sales-orders');
  return response.data;
};

export const getSalesOrderById = async (id: number): Promise<SalesOrder> => {
  const response = await apiClient.get<SalesOrder>(`/sales-orders/${id}`);
  return response.data;
};

export const createSalesOrder = async (orderData: CreateSalesOrderPayload): Promise<SalesOrder> => {
  const response = await apiClient.post<SalesOrder>('/sales-orders', orderData);
  return response.data;
};

// General update (for status)
export const updateSalesOrder = async (id: number, payload: UpdateSalesOrderPayload): Promise<SalesOrder> => {
  const response = await apiClient.patch<SalesOrder>(`/sales-orders/${id}`, payload);
  return response.data;
};

// New specific update for notes
export const updateSalesOrderNotes = async (id: number, payload: UpdateSalesOrderNotesPayload): Promise<SalesOrder> => {
  const response = await apiClient.patch<SalesOrder>(`/sales-orders/${id}/notes`, payload);
  return response.data;
};

export const deleteSalesOrder = async (id: number): Promise<void> => {
  await apiClient.delete(`/sales-orders/${id}`);
};

// --- Interceptor de Peticiones Axios para añadir Token JWT --- 
apiClient.interceptors.request.use(
  (config) => {
    // Obtener token de localStorage
    const token = localStorage.getItem('accessToken');
    if (token) {
      // Si el token existe, añadirlo a la cabecera Authorization
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // Devolver la configuración modificada
  },
  (error) => {
    // Manejar errores de la configuración de la petición
    return Promise.reject(error);
  }
);

// TODO: Podríamos añadir un interceptor de *respuestas* para manejar errores 401 (Unauthorized)
// globalmente, por ejemplo, redirigiendo al login si el token expira.

export default apiClient; 