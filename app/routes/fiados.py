from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import schemas
from app.services.fiados_service import FiadosService

router = APIRouter(prefix="/fiados", tags=["Fiados"])


@router.post("/deudores", response_model=schemas.DeudorRead, status_code=201)
def crear_deudor(datos: schemas.DeudorCreate, db: Session = Depends(get_db)):
    return FiadosService.crear_deudor(db, datos)


@router.get("/deudores", response_model=List[schemas.DeudorRead])
def listar_deudores(db: Session = Depends(get_db)):
    return FiadosService.listar_deudores(db)


@router.get("/deudores/{deudor_id}", response_model=schemas.DeudorRead)
def obtener_deudor(deudor_id: int, db: Session = Depends(get_db)):
    return FiadosService.obtener_deudor(db, deudor_id)


@router.post("/deudores/{deudor_id}/cargo", response_model=schemas.MovimientoRead, status_code=201)
def agregar_cargo(deudor_id: int, datos: schemas.MovimientoCreate, db: Session = Depends(get_db)):
    return FiadosService.agregar_cargo(db, deudor_id, datos)


@router.post("/deudores/{deudor_id}/pago", response_model=schemas.MovimientoRead, status_code=201)
def registrar_pago(deudor_id: int, datos: schemas.MovimientoCreate, db: Session = Depends(get_db)):
    return FiadosService.registrar_pago(db, deudor_id, datos)


@router.get("/deudores/{deudor_id}/historial", response_model=List[schemas.MovimientoRead])
def historial_deudor(deudor_id: int, db: Session = Depends(get_db)):
    return FiadosService.historial(db, deudor_id)
