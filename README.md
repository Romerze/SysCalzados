# SystemCalzados - Sistema de Gestión ERP

Sistema básico para la gestión de Calzados XYZ, desarrollado con NestJS (Backend) y React + Ant Design (Frontend).

## Funcionalidades Principales

*   **Gestión de Clientes:** CRUD básico.
*   **Gestión de Proveedores:** CRUD básico.
*   **Gestión de Materias Primas:** CRUD básico, asociación con Proveedores.
*   **Gestión de Productos:**
    *   CRUD de productos con variantes (talla, color).
    *   Composición de materias primas por producto.
    *   Generación automática de SKU para variantes (`[NOMBRE(3)]-[TALLA]-[COLOR(3)]`) con validación de unicidad.
    *   Modal de creación de producto mejorado con pasos.
    *   Modal de edición de variante con SKU no editable.
*   **Gestión de Pedidos de Venta:**
    *   CRUD de pedidos de venta asociados a clientes.
    *   Selección de productos y cálculo automático de total.
    *   Gestión de estados (Pendiente, Confirmado, Enviado, Entregado, Cancelado).
    *   **Validación de stock** al confirmar un pedido.
    *   **Generación automática de Órdenes de Producción** si no hay stock suficiente al confirmar.
    *   **Visualización del estado de producción** directamente en la tabla de pedidos de venta (iconos).
    *   **Validaciones de acciones** corregidas (confirmar, cancelar, eliminar).
    *   **Diálogos de confirmación** (`Popconfirm`) para acciones de Cancelar y Eliminar.
    *   Colores de estado mejorados para mejor diferenciación visual.
*   **Gestión de Órdenes de Producción:**
    *   CRUD básico de órdenes de producción asociadas a productos.
    *   Gestión de estados (Pendiente, En Progreso, Completado, Cancelado).
    *   **Consumo automático de stock** de materias primas al iniciar producción (con validación previa).
    *   **Incremento automático de stock** del producto terminado al completar la orden.
    *   **Visualización del Pedido de Venta de origen** en la tabla.
*   **Gestión de Movimientos de Stock:** Registro automático de entradas (al completar producción) y salidas (al iniciar producción).

## Tecnologías

*   **Backend:** NestJS, TypeORM, PostgreSQL
*   **Frontend:** React, TypeScript, Ant Design, Axios

## Próximos Pasos / Mejoras Pendientes

*   Refinar UI/UX en general.
*   Implementar paginación y filtros más avanzados en tablas.
*   Añadir dashboard principal.
*   Mejorar manejo de errores y feedback al usuario.
*   Implementar autenticación y autorización.
*   Añadir pruebas unitarias e integración.
*   Gestión de stock más compleja (reservas, lotes, etc.).
*   Lógica para reponer stock al cancelar pedidos confirmados (actualmente solo advierte).

## Instalación y Ejecución

(Instrucciones básicas)

1.  **Backend:**
    ```bash
    cd backend
    npm install
    # Configurar .env con datos de PostgreSQL
    npm run start:dev
    ```
2.  **Frontend:**
    ```bash
    cd frontend
    npm install
    npm start
    ```

---

## Instrucciones de Configuración y Ejecución

**Requisitos Previos:**

*   Node.js (v18 o superior recomendado)
*   npm (o yarn)
*   PostgreSQL instalado y corriendo
*   Git

**Pasos:**

1.  **Clonar el Repositorio:**
    ```bash
    git clone [URL_DEL_REPOSITORIO]
    cd [NOMBRE_CARPETA_PROYECTO]
    ```

2.  **Configurar Backend:**
    *   Navega a la carpeta `backend`: `cd backend`
    *   Copia el archivo `.env.example` a `.env`: `cp .env.example .env`
    *   Edita el archivo `.env` con los detalles de tu conexión a PostgreSQL (host, puerto, usuario, contraseña, nombre de la base de datos).
    *   Instala las dependencias: `npm install` (o `yarn install`)
    *   Ejecuta las migraciones de TypeORM (si existen): `npm run typeorm:run-migrations` (puede variar según la configuración)
    *   Inicia el servidor de desarrollo: `npm run start:dev` (o `yarn start:dev`)
        *   El backend estará disponible por defecto en `http://localhost:3000`

3.  **Configurar Frontend:**
    *   Abre otra terminal y navega a la carpeta `frontend`: `cd frontend`
    *   Instala las dependencias: `npm install` (o `yarn install`)
    *   Inicia el servidor de desarrollo: `npm run dev` (o `yarn dev`)
        *   El frontend estará disponible por defecto en `http://localhost:5173` (o el puerto que indique Vite)

4.  **Acceder a la Aplicación:**
    *   Abre tu navegador y ve a la dirección del frontend.
    *   Deberías poder registrar un nuevo usuario y luego iniciar sesión.

---

## Estado Actual (Funcionalidades Implementadas)

### Backend

*   **Autenticación:** Registro e inicio de sesión con JWT.
*   **Usuarios:** Gestión básica.
*   **Proveedores:** CRUD completo.
*   **Materias Primas:** CRUD completo, con relación a Proveedores.
*   **Clientes:** CRUD completo.
*   **Productos:**
    *   CRUD completo para productos base y variantes.
    *   **Generación Automática de SKU:** Formato `[NOMBRE(3)]-[TALLA]-[COLOR(3)]` con validación de unicidad.
    *   **Composición (BOM):** Gestión de materias primas por producto.
*   **Movimientos de Stock:** CRUD básico para registrar entradas/salidas de materias primas.
*   **Órdenes de Producción:** CRUD básico con estados.
*   **Pedidos de Venta:**
    *   CRUD básico para pedidos y sus ítems.
    *   Relaciones con Clientes y Productos.
    *   Corrección de dependencias en el módulo.

### Frontend

*   **Autenticación:** Páginas de Login y Registro funcionales.
*   **Rutas Protegidas:** Implementadas para asegurar acceso.
*   **Layout Principal:** Con menú lateral para navegación.
*   **Gestión:** Páginas con tablas (con búsqueda/filtrado), modales de creación/edición para Proveedores, Materias Primas, Clientes.
*   **Productos:**
    *   Listado de modelos con variantes anidadas.
    *   Modal multi-paso para creación (sin campo SKU manual).
    *   Modal de edición de variantes (SKU solo lectura).
    *   Gestión de composición en el modal de creación.
*   **Órdenes de Producción:** Listado y modal de creación/detalle.
*   **Movimientos de Stock:** Listado básico.
*   **Pedidos de Venta:**
    *   Listado de pedidos.
    *   Modal de creación con selección de cliente, ítems dinámicos, cálculo de totales.
    *   Modal de visualización de detalles.
    *   Funcionalidad básica para cambio de estado desde la tabla.

---

## To-Do List (Resumen Próximos Pasos)

*   **Backend:**
    *   Implementar lógica de negocio avanzada (descuento/reserva de stock en pedidos/producción).
    *   Refinar estados y transiciones en Órdenes de Producción y Pedidos de Venta.
    *   Implementar Reportes.
    *   Pruebas Unitarias/Integración.
*   **Frontend:**
    *   Refinar la gestión de estados en Pedidos de Venta (confirmación visual, manejo de errores).
    *   Completar/Mejorar funcionalidad de edición de Pedidos de Venta.
    *   Implementar interfaz para Reportes.
    *   Mejoras generales de UI/UX.
*   **General:**
    *   Configurar CI/CD y Despliegue. 