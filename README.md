# Sistema de Gestión para Fábrica de Calzados

Este proyecto es un sistema de gestión integral diseñado para optimizar los procesos de una fábrica de calzados.

**Pila Tecnológica:**

*   **Frontend:** React (con TypeScript) + Ant Design (AntD)
*   **Backend:** Node.js con NestJS
*   **Base de Datos:** PostgreSQL

---

## To-Do List (Lista de Tareas Pendientes)

### Fase 1: Configuración y Bases del Proyecto

-   [ ] **Frontend (React):**
    -   [x] Crear proyecto React con Vite y TypeScript.
    -   [x] Instalar y configurar Ant Design (AntD).
    -   [x] Instalar y configurar `react-router-dom` para navegación.
    -   [x] Instalar `axios` para llamadas a la API.
    -   [x] Definir estructura de carpetas base (`src/components`, `src/pages`, `src/services`, `src/hooks`, `src/layouts`).
-   [ ] **Backend (NestJS):**
    -   [x] Crear proyecto NestJS.
    -   [x] Configurar conexión a base de datos **PostgreSQL**.
    -   [x] Configurar TypeORM (o el ORM elegido) para interactuar con la BD.
-   [ ] **Infraestructura (Opcional Inicial):**
    -   [ ] Configurar Docker para Frontend y Backend.
    -   [x] Configurar un repositorio Git.

### Fase 2: Módulo de Autenticación y Usuarios

-   [x] Backend: Definir modelo/entidad de Usuario.
-   [x] Backend: Implementar lógica de registro y login (ej. con JWT).
-   [ ] Backend: Crear endpoints para autenticación y gestión básica de usuarios.
-   [x] Frontend: Crear páginas de Login y Registro usando componentes AntD.
-   [x] Frontend: Implementar lógica para llamar a los endpoints de autenticación.
-   [x] Frontend: Implementar rutas protegidas.
-   [x] Frontend: Crear un layout base para la aplicación autenticada (con menú/sidebar AntD).

### Fase 3: Módulos Principales (Ejemplos Iniciales)

-   [x] **Gestión de Proveedores:**
    -   [x] Backend: Definir modelo/entidad de Proveedor.
    -   [x] Backend: Crear endpoints CRUD para Proveedores.
    -   [x] Frontend: Crear página/componente para listar y gestionar Proveedores.
-   [x] **Gestión de Materias Primas:**
    -   [x] Backend: Definir modelo/entidad de MateriaPrima.
    -   [x] Backend: Crear endpoints CRUD para Materias Primas.
    -   [x] Frontend: Crear página/componente para listar y gestionar Materias Primas.
-   [x] **Gestión de Clientes:**
    -   [x] Backend: Definir modelo/entidad de Cliente.
    -   [x] Backend: Crear endpoints CRUD para Clientes.
    -   [x] Frontend: Crear página/componente para listar y gestionar Clientes.
-   [x] **Gestión de Productos:**
    -   [x] Backend: Definir modelo/entidad de Producto.
    -   [x] Backend: Crear endpoints CRUD para Productos.
    -   [x] Frontend: Crear página/componente para listar y gestionar Productos.
    -   [x] Frontend: Implementar agrupación de productos por modelo y vista expandible para variantes.
-   [x] **Relación Productos - Materias Primas (Composición/BOM):**
    -   [x] Backend: Crear entidad `ProductComposition` (ID, productId, rawMaterialId, quantity).
    -   [x] Backend: Actualizar entidades `Product` y `RawMaterial` con relaciones OneToMany.
    -   [x] Backend: Crear módulo `ProductComposition` (Service, Controller, DTOs).
    -   [x] Backend: Actualizar `ProductsService` para manejar la creación/actualización de la composición.
    -   [x] Backend: Generar y ejecutar migración de base de datos.
    -   [x] Frontend: Actualizar tipos y funciones de API relacionadas con productos.
    -   [x] Frontend: Refactorizar modal de Productos para usar `Steps`.
    -   [x] Frontend: Implementar UI en el modal para añadir/eliminar/ver ítems de composición.
-   [x] **Movimientos de Stock:**
    -   [x] Backend: Crear entidad y módulo.
    -   [x] Backend: Implementar lógica para actualizar stock de Materias Primas.
    -   [x] Backend: Añadir campo `stockAfterMovement` para registrar stock resultante.
    -   [x] Frontend: Crear página para ver historial y registrar movimientos.
    -   [x] Frontend: Añadir columna "Stock Resultante" a la tabla.
-   *... (Añadiremos más módulos aquí: Órdenes de Producción, Pedidos, etc.)*

### Fase 4: Características Adicionales y Despliegue

-   [ ] Implementar Control de Calidad.
-   [ ] Implementar Facturación.
-   [ ] Implementar Reportes.
-   [ ] Escribir Pruebas (Unitarias, Integración).
-   [ ] Configurar CI/CD.
-   [ ] Desplegar la aplicación. 