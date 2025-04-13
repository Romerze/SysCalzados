import axios from 'axios';
import { LoginFormValues, RegisterFormValues } from '../types/formTypes';
import { Supplier, RawMaterial, Client, Product, StockMovement, MovementType, CompositionItem } from '../types/models'; // Importar tipo Supplier, RawMaterial, Client, Product, StockMovement, MovementType, CompositionItem

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
type UpdateProductPayload = Partial<CreateProductPayload>;

// Tipos para StockMovement DTOs
type CreateStockMovementPayload = {
  rawMaterialId: number;
  type: MovementType;
  quantity: number;
  notes?: string;
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

export const updateProduct = async (id: number, productData: UpdateProductPayload): Promise<Product> => {
  const response = await apiClient.patch<Product>(`/products/${id}`, productData);
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