from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app import models
from app.services.productos_service import ProductosService
from app import schemas

# Aquí definimos el router
router = APIRouter(prefix="/productos", tags=["Productos"])

@router.get("/")
def listar_productos(db: Session = Depends(get_db)):
    return db.query(models.Producto).all()

@router.get("/reporte-critico")
def analizar_stock(db: Session = Depends(get_db)):
    bajos = db.query(models.Producto).filter(models.Producto.stock < 10).all()
    return {
        "analisis": "Inventario Crítico Detectado",
        "items": bajos
    }


@router.post("/", response_model=schemas.ProductoBase)
def crear_producto(producto: schemas.ProductoCreate, db: Session = Depends(get_db)):
    return ProductosService.crear_producto(db, producto)

@router.get("/buscar")
def buscar_producto(termino: str, db: Session = Depends(get_db)):
    return ProductosService.buscar_productos(db, termino)