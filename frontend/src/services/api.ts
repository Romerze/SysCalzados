import axios from 'axios';
import { LoginFormValues, RegisterFormValues } from '../types/formTypes';

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

// Podríamos añadir funciones para obtener/poner el token JWT en las cabeceras aquí más tarde

export default apiClient; 