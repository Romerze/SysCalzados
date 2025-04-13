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
    -   [ ] Configurar un repositorio Git.

### Fase 2: Módulo de Autenticación y Usuarios

-   [x] Backend: Definir modelo/entidad de Usuario.
-   [ ] Backend: Implementar lógica de registro y login (ej. con JWT).
-   [ ] Backend: Crear endpoints para autenticación y gestión básica de usuarios.
-   [ ] Frontend: Crear páginas de Login y Registro usando componentes AntD.
-   [ ] Frontend: Implementar lógica para llamar a los endpoints de autenticación.
-   [ ] Frontend: Implementar rutas protegidas.
-   [ ] Frontend: Crear un layout base para la aplicación autenticada (con menú/sidebar AntD).

### Fase 3: Módulos Principales (Ejemplos Iniciales)

-   [ ] **Gestión de Inventario (Materias Primas):**
    -   [ ] Backend: Definir modelos/entidades (Proveedor, MateriaPrima, Compra).
    -   [ ] Backend: Crear endpoints CRUD para Proveedores y Materias Primas.
    -   [ ] Frontend: Crear páginas/componentes para listar y gestionar Proveedores/Materias Primas (usando tablas, formularios AntD, etc.).
-   [ ] **Gestión de Clientes:**
    -   [ ] Backend: Definir modelo/entidad de Cliente.
    -   [ ] Backend: Crear endpoints CRUD para Clientes.
    -   [ ] Frontend: Crear páginas/componentes para listar y gestionar Clientes.
-   *... (Añadiremos más módulos aquí: Producto Terminado, Órdenes de Producción, Pedidos, etc.)*

### Fase 4: Características Adicionales y Despliegue

-   [ ] Implementar Control de Calidad.
-   [ ] Implementar Facturación.
-   [ ] Implementar Reportes.
-   [ ] Escribir Pruebas (Unitarias, Integración).
-   [ ] Configurar CI/CD.
-   [ ] Desplegar la aplicación. 