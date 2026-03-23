# SmartStore Engine

Backend para gestión de almacén de barrio. Construido con **FastAPI** y **MySQL**.

## Stack

- Python + FastAPI
- SQLAlchemy (ORM)
- MySQL
- Pydantic v2

## Módulos

| Módulo | Descripción |
|---|---|
| **Productos** | CRUD completo, búsqueda, reporte de stock crítico |
| **Ventas** | Registro de ventas, vuelto automático, descuento de stock |
| **Fiados** | Gestión de deudores, cargos y pagos, historial por cliente |
| **Arqueo de caja** | Apertura y cierre diario, cálculo de diferencias |
| **Stats** | KPIs del día, gráfico de ventas por rango, top producto |

## Instalación

```bash
# 1. Clonar el repo
git clone https://github.com/nievarodrigo/smartstore-engine
cd smartstore-engine

# 2. Crear entorno virtual e instalar dependencias
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# 3. Configurar la base de datos
cp .env.example .env
# Editar .env con tus credenciales de MySQL

# 4. Levantar el backend
uvicorn app.main:app --reload

# 5. Levantar el frontend (en otra terminal)
cd frontend
npm install
npm run dev
```

- Backend: `http://localhost:8000` — docs en `/docs`
- Frontend: `http://localhost:5173`

## Datos de demo

Para cargar datos de prueba (productos, ventas, deudores y arqueo):

```bash
python seed.py
```

Genera 20 productos de almacén, 60 ventas de los últimos 30 días, 5 deudores con historial de fiados y el arqueo del día. Se puede correr una sola vez — los datos quedan guardados en la BD.

## Endpoints principales

### Productos
```
GET    /productos/              Lista todos los productos
POST   /productos/              Crea un producto
GET    /productos/buscar?termino=x  Busca por nombre
PUT    /productos/{id}          Actualiza precio/stock/nombre
DELETE /productos/{id}          Elimina producto
GET    /productos/reporte-critico   Productos con stock < 10
```

### Ventas
```
POST   /ventas/registrar        Registra una venta
GET    /ventas/                 Historial (filtrable por fecha)
GET    /ventas/stats/hoy        KPIs del día
GET    /ventas/stats/grafico    Ventas por rango de fechas
GET    /ventas/stats/top-producto  Producto más vendido
```

### Fiados
```
POST   /fiados/deudores                     Registra un deudor
GET    /fiados/deudores                     Lista deudores con deuda total
GET    /fiados/deudores/{id}                Detalle de un deudor
POST   /fiados/deudores/{id}/cargo          Agrega deuda
POST   /fiados/deudores/{id}/pago           Registra un pago
GET    /fiados/deudores/{id}/historial      Movimientos del deudor
```

### Arqueo de caja
```
POST   /arqueo/abrir    Abre la caja con el monto inicial del día
POST   /arqueo/cerrar   Cierra la caja con el monto contado
GET    /arqueo/hoy      Estado actual de la caja
GET    /arqueo/historial  Últimos 30 arqueos
```

## Variables de entorno

```env
DATABASE_URL=mysql+mysqlconnector://usuario:password@localhost:3306/smart_store
```
