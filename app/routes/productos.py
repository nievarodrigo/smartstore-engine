from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import models, schemas
from app.services.productos_service import ProductosService

router = APIRouter(prefix="/productos", tags=["Productos"])


@router.get("/", response_model=List[schemas.ProductoRead])
def listar_productos(db: Session = Depends(get_db)):
    return db.query(models.Producto).all()


@router.get("/buscar", response_model=List[schemas.ProductoRead])
def buscar_producto(termino: str, db: Session = Depends(get_db)):
    return ProductosService.buscar_productos(db, termino)


@router.get("/reporte-critico", response_model=List[schemas.ProductoRead])
def analizar_stock(db: Session = Depends(get_db)):
    return db.query(models.Producto).filter(models.Producto.stock < 10).all()


@router.post("/", response_model=schemas.ProductoRead, status_code=201)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    return ProductosService.crear_producto(db, producto)


@router.put("/{producto_id}", response_model=schemas.ProductoRead)
def actualizar_producto(
    producto_id: int,
    datos: schemas.ProductoUpdate,
    db: Session = Depends(get_db)
):
    return ProductosService.actualizar_producto(db, producto_id, datos)


@router.delete("/{producto_id}", status_code=204)
def eliminar_producto(producto_id: int, db: Session = Depends(get_db)):
    ProductosService.eliminar_producto(db, producto_id)
