# Microservicio Ventas + Frontend — ERP Bodega Inteligente
## Integrante 2 — CS2032 Cloud Computing

---

## 1. Qué hace este microservicio

Lleva el registro de las ventas diarias de cada producto de la bodega y de los pedidos hechos
a proveedores, calcula un estado de rotación por producto (semáforo ROJO/AMARILLO/VERDE) a
partir del volumen vendido, y expone esa información vía API REST para que el microservicio
**Alertas** y el **frontend** puedan consumirla. Además incluye el dashboard web (React) donde
se visualiza ese semáforo.

---

## 2. Datos que maneja (entidades / tablas y campos principales)

### Tabla `pedidos_proveedor`
| Campo | Tipo | Descripción |
|---|---|---|
| id | SERIAL (PK) | Identificador único del pedido |
| proveedor_id | INT | Identificador del proveedor (referencia lógica al microservicio Proveedores) |
| fecha_pedido | DATE | Fecha en que se hizo el pedido |
| monto_total | DECIMAL(10,2) | Monto total del pedido |

### Tabla `ventas_diarias`
| Campo | Tipo | Descripción |
|---|---|---|
| id | SERIAL (PK) | Identificador de la venta |
| producto_id | INT | Producto vendido — es el mismo `producto_id` que usan todos los demás microservicios |
| cantidad | INT | Unidades vendidas en ese registro |
| precio_unitario | DECIMAL(8,2) | Precio unitario al momento de la venta |
| fecha | TIMESTAMP | Fecha y hora de la venta |
| pedido_id | INT (FK → pedidos_proveedor.id) | Pedido de proveedor asociado (si aplica) |

Las dos tablas están relacionadas por `pedido_id` — es la relación mínima de 2 tablas que exige
el enunciado del curso para cada base de datos SQL.

---

## 3. Base de datos

- **Motor:** PostgreSQL 16
- **Nombre de la base de datos:** `db_ventas`
- **Usuario:** `postgres`
- **Puerto:** `5432`
- **Estructura de tablas:** ver sección 2 arriba. Se crean automáticamente al correr
  [`poblar.py`](./backend-ventas/poblar.py) (no hay un `schema.sql` separado — el propio script
  hace `CREATE TABLE IF NOT EXISTS` antes de insertar).

Diagrama Entidad/Relación: pendiente de generar — 2 tablas relacionadas por `pedido_id`.

---

## 4. Cómo se llena la base de datos

- Script de carga inicial: [`backend-ventas/poblar.py`](./backend-ventas/poblar.py), con `psycopg2`
  (sin librería tipo Faker — los datos se generan con `random` directamente).
- Inserta **1 registro base** en `pedidos_proveedor` y **20,000 registros** en `ventas_diarias`
  (cumple el mínimo exigido por el enunciado del curso).
- Es una **carga única** (one-time bulk load). Para correrla:
  ```bash
  cd backend-ventas
  pip install psycopg2-binary
  python poblar.py
  ```
  (requiere que `db_ventas` ya esté levantado con `docker-compose up -d db_ventas`).
- Fuera de esa carga inicial, el resto de ventas se generan cuando alguien llama al endpoint
  `POST /ventas` (pruebas manuales o eventualmente otros microservicios/el frontend).

---

## 5. Endpoints disponibles (API REST)

Documentados automáticamente en Swagger-UI: `http://localhost:8082/swagger-ui.html`

| Método | Ruta | Descripción |
|---|---|---|
| `POST` | `/ventas` | Registra una nueva venta. Si no se envía `fecha`, se asigna la fecha/hora actual. |
| `GET` | `/ventas` | Resumen agrupado por producto: cantidad total vendida + estado (`ROJO`/`AMARILLO`/`VERDE`). Es lo que consume el dashboard para pintar el semáforo. |
| `GET` | `/ventas/{productoId}` | Historial completo de ventas de un producto puntual. |

**Ejemplo de respuesta de `GET /ventas`:**
```json
[
  { "productoId": 7, "cantidad": 4820, "estado": "ROJO" },
  { "productoId": 12, "cantidad": 5150, "estado": "AMARILLO" },
  { "productoId": 3, "cantidad": 6200, "estado": "VERDE" }
]
```

**Ejemplo de body para `POST /ventas`:**
```json
{
  "productoId": 7,
  "cantidad": 3,
  "precioUnitario": 12.50
}
```

### Lógica actual del semáforo (definida en `VentaRepository`)

- **ROJO:** suma de cantidad vendida < 5000
- **AMARILLO:** entre 5000 y 5300
- **VERDE:** más de 5300

> ⚠️ Pendiente de alinear con Integrante 3: según el diseño del proyecto, el color final del
> semáforo debería calcularlo **Alertas** combinando Ventas + Inventario + Predicción +
> Proveedores, no Ventas de forma aislada con sus propios umbrales.

---

## 6. ¿Los datos cambian constantemente o se cargan una sola vez?

- `pedidos_proveedor`: **prácticamente estático** — solo tiene el registro base insertado por
  el seed; en un escenario real crecería cada vez que se hace un pedido nuevo.
- `ventas_diarias`: en teoría **crece con cada venta registrada**, pero en la práctica del
  proyecto la mayor parte del volumen viene de la carga masiva inicial (20,000 registros), más
  las ventas de prueba que se registren manualmente o desde el frontend.

---

## 7. Campos para cargas incrementales

- `ventas_diarias.fecha` — se puede filtrar con `fecha > último_timestamp_extraído` para pulls
  incrementales.
- `pedidos_proveedor.fecha_pedido` — equivalente para la tabla de pedidos.

> Nota: igual que en Inventario, el enunciado pide que el pipeline de ingesta (Data Science)
> haga **pull del 100% de los registros**, no necesariamente incremental. Estos campos quedan
> disponibles por si se necesitan más adelante.

---

## 8. Configuración y despliegue

- **Archivo de configuración:** `backend-ventas/src/main/resources/application.properties`,
  con variables `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` (con valores por
  defecto para correr sin Docker).
- **Puerto del servicio:** `8082`
- **Comando para levantar backend + base de datos:**
  ```bash
  docker-compose up --build
  ```
- **Documentación interactiva:** una vez levantado, disponible en
  `http://localhost:8082/swagger-ui.html`.

### Estado del despliegue en AWS
`solo local`

---

## 9. Frontend (dashboard)

- **Carpeta:** [`frontend-bodega/`](./frontend-bodega)
- **Stack:** React 18 + Vite, `lucide-react` para íconos.
- **Vista actual:** `Semaforo.jsx` — grid de tarjetas por producto, cada una con su color
  (rojo/amarillo/verde) y una etiqueta de rotación, consumiendo `GET /ventas`.
- **Cómo correrlo:**
  ```bash
  cd frontend-bodega
  npm install
  npm run dev
  ```
  Se sirve en `http://localhost:5173`.

### Pendientes del frontend
- [ ] La URL del backend está hardcodeada en `Semaforo.jsx` (`http://localhost:8082`) — hay
  que moverla a una variable de entorno de Vite antes de desplegar en AWS Amplify.
- [ ] Falta la vista de detalle por producto (stock vs. predicción vs. tiempo de entrega) que
  pide el enunciado — depende de que Inventario, Predicción y Proveedores ya tengan sus
  endpoints listos para consumir.
- [ ] Falta el panel de estadísticas del microservicio Analítica.

---

## 10. Fuera de alcance de este README

Las preguntas sobre los microservicios **Inventario**, **Proveedores**, **Predicción**,
**Alertas** y **Analítica** (datos que manejan, endpoints, lógica interna, pipeline de Data
Science) corresponden a los demás integrantes del equipo — este README solo cubre Ventas y el
Frontend, que es la parte de la que me encargué.
