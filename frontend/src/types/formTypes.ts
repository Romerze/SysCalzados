// Tipos para los valores de los formularios de autenticación

export interface LoginFormValues {
  email: string;
  password: string;
  remember?: boolean; // Opcional
}

export interface RegisterFormValues {
  email: string;
  password: string;
  confirm: string;
} 