from pydantic import BaseModel, model_validator
from typing import List, Optional
from datetime import datetime, date


# ── Producto ──────────────────────────────────────────────
class ProductoBase(BaseModel):
    nombre: str
    precio: float
    stock: int
    categoria: Optional[str] = None
    codigo_barras: Optional[str] = None

class ProductoCreate(ProductoBase):
    pass

class ProductoUpdate(BaseModel):
    nombre: Optional[str] = None
    precio: Optional[float] = None
    stock: Optional[int] = None
    categoria: Optional[str] = None
    codigo_barras: Optional[str] = None

class ProductoRead(ProductoBase):
    id: int
    class Config:
        from_attributes = True


# ── Ventas ────────────────────────────────────────────────
class DetalleRead(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: float
    nombre_producto: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def get_nombre_producto(cls, data):
        if hasattr(data, "producto") and data.producto:
            data.nombre_producto = data.producto.nombre
        return data

    class Config:
        from_attributes = True

class ItemVenta(BaseModel):
    producto_id: int
    cantidad: int

class VentaCreate(BaseModel):
    items: List[ItemVenta]
    pago_con: float
    metodo_pago: str = "efectivo"
    deudor_id: Optional[int] = None

class VentaRead(BaseModel):
    id: int
    fecha_hora: datetime
    total: float
    metodo_pago: str
    detalles: List[DetalleRead] = []

    class Config:
        from_attributes = True

class EstadisticasVentas(BaseModel):
    total_recaudado: float
    cantidad_ventas: int

class RegistroGrafico(BaseModel):
    fecha: str
    total: float

class ProductoMasVendido(BaseModel):
    producto_nombre: str
    cantidad_total: int


# ── Fiados ────────────────────────────────────────────────
class DeudorCreate(BaseModel):
    nombre: str
    telefono: Optional[str] = None

class MovimientoCreate(BaseModel):
    monto: float
    descripcion: Optional[str] = None

class MovimientoRead(BaseModel):
    id: int
    tipo: str
    monto: float
    descripcion: Optional[str] = None
    fecha: datetime

    class Config:
        from_attributes = True

class DeudorRead(BaseModel):
    id: int
    nombre: str
    telefono: Optional[str] = None
    total_adeudado: float
    fecha_creacion: datetime

    class Config:
        from_attributes = True


# ── Arqueo de caja ────────────────────────────────────────
class AperturaCreate(BaseModel):
    monto_apertura: float

class CierreCreate(BaseModel):
    monto_cierre: float

class ArqueoRead(BaseModel):
    id: int
    fecha: date
    monto_apertura: float
    monto_cierre: Optional[float] = None
    total_ventas: Optional[float] = None
    diferencia: Optional[float] = None
    estado: str

    class Config:
        from_attributes = True
