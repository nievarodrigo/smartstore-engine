from pydantic import BaseModel, field_validator, model_validator
from typing import List, Optional
from datetime import datetime

# 1. Esquemas de Producto
class ProductoBase(BaseModel):
    nombre: str
    precio: float
    stock: int
    categoria: Optional[str] = None

class ProductoCreate(ProductoBase):
    pass

# 2. Esquema de Detalle (Extrae el nombre del producto desde la relación de BD)
class DetalleRead(BaseModel):
    producto_id: int
    cantidad: int
    precio_unitario: float
    nombre_producto: Optional[str] = None

    @model_validator(mode='before')
    @classmethod
    def get_nombre_producto(cls, data):
        # Si la data es un objeto de SQLAlchemy (tiene el atributo 'producto')
        if hasattr(data, "producto") and data.producto:
            # Seteamos el nombre directamente desde la relación del modelo
            data.nombre_producto = data.producto.nombre
        return data

    class Config:
        from_attributes = True

# 3. Esquemas de Venta
class VentaCreate(BaseModel):
    producto_id: int
    cantidad: int
    pago_con: float

class VentaRead(BaseModel):
    id: int
    fecha_hora: datetime
    total: float
    metodo_pago: str
    # IMPORTANTE: Esto vincula la lista de detalles a la venta
    detalles: List[DetalleRead] = []

    class Config:
        from_attributes = True

# 4. Esquemas de Estadísticas y KPIs
class EstadisticasVentas(BaseModel):
    total_recaudado: float
    cantidad_ventas: int

class RegistroGrafico(BaseModel):
    fecha: str
    total: float

class ProductoMasVendido(BaseModel):
    producto_nombre: str
    cantidad_total: int