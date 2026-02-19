from sqlalchemy.orm import Session
from app import models, schemas

class ProductosService:
    @staticmethod
    def crear_producto(db: Session, producto: schemas.ProductoCreate):
        nuevo_producto = models.Producto(
            nombre=producto.nombre,
            precio=producto.precio,
            stock=producto.stock,
            categoria=producto.categoria
        )
        db.add(nuevo_producto)
        db.commit()
        db.refresh(nuevo_producto)
        return nuevo_producto

    @staticmethod
    def buscar_productos(db: Session, termino: str):
        return db.query(models.Producto).filter(
            models.Producto.nombre.ilike(f"%{termino}%")
        ).all()