from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app import schemas
from app.services.venta_services import VentasService # Importamos el servicio centralizado
from typing import List, Optional
from datetime import datetime, date

router = APIRouter(prefix="/ventas", tags=["Ventas"])

@router.post("/registrar")
def registrar_venta(pedido: schemas.VentaCreate, db: Session = Depends(get_db)):
    # Eliminamos la lógica manual de aquí y usamos el Service.
    # El Service es el que tiene el 'db.add(detalle)' que hace que todo funcione.
    return VentasService.procesar_registro_venta(db, pedido)

@router.get("/", response_model=List[schemas.VentaRead])
def listar_ventas(
    db: Session = Depends(get_db),
    inicio: Optional[datetime] = None, 
    fin: Optional[datetime] = None
):
    # Asegúrate de que el Service tenga definido el método obtener_historial
    return VentasService.obtener_historial(db, fecha_inicio=inicio, fecha_fin=fin)

@router.get("/stats/hoy", response_model=schemas.EstadisticasVentas)
def kpis_del_dia(db: Session = Depends(get_db)):
    return VentasService.obtener_kpis_dia(db)

@router.get("/stats/grafico", response_model=List[schemas.RegistroGrafico])
def datos_grafico(inicio: date, fin: date, db: Session = Depends(get_db)):
    return VentasService.obtener_datos_grafico(db, inicio, fin)

@router.get("/stats/top-producto", response_model=schemas.ProductoMasVendido)
def top_producto(inicio: date, fin: date, db: Session = Depends(get_db)):
    return VentasService.producto_mas_vendido(db, inicio, fin)