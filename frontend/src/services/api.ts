import axios from 'axios';
import { LoginFormValues, RegisterFormValues } from '../types/formTypes';
import { Supplier, RawMaterial } from '../types/models'; // Importar tipo Supplier y RawMaterial

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

// Podríamos añadir funciones para obtener/poner el token JWT en las cabeceras aquí más tarde

export default apiClient; 