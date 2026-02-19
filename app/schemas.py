from pydantic import BaseModel
from typing import Optional

class ProductoBase(BaseModel):
    nombre: str
    precio: float
    stock: int
    categoria: Optional[str] = None

class ProductoCreate(ProductoBase): # Usamos herencia para no repetir campos
    pass

class VentaCreate(BaseModel):
    producto_id: int
    cantidad: int
    pago_con: float