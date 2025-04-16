# Sistema de Gestión para Fábrica de Calzados

Este proyecto es un sistema de gestión integral diseñado para optimizar los procesos de una fábrica de calzados.

**Pila Tecnológica:**

*   **Frontend:** React (con TypeScript) + Ant Design (AntD)
*   **Backend:** Node.js con NestJS
*   **Base de Datos:** PostgreSQL

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