from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import models, schemas


class ProductosService:

    @staticmethod
    def crear_producto(db: Session, producto: schemas.ProductoCreate):
        nuevo = models.Producto(
            nombre=producto.nombre,
            precio=producto.precio,
            stock=producto.stock,
            categoria=producto.categoria
        )
        db.add(nuevo)
        db.commit()
        db.refresh(nuevo)
        return nuevo

    @staticmethod
    def buscar_productos(db: Session, termino: str):
        return db.query(models.Producto).filter(
            models.Producto.nombre.ilike(f"%{termino}%")
        ).all()

    @staticmethod
    def actualizar_producto(db: Session, producto_id: int, datos: schemas.ProductoUpdate):
        producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        for campo, valor in datos.model_dump(exclude_unset=True).items():
            setattr(producto, campo, valor)
        db.commit()
        db.refresh(producto)
        return producto

    @staticmethod
    def eliminar_producto(db: Session, producto_id: int):
        producto = db.query(models.Producto).filter(models.Producto.id == producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")
        db.delete(producto)
        db.commit()
