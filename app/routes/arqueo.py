from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from app.database import get_db
from app import schemas
from app.services.arqueo_service import ArqueoService

router = APIRouter(prefix="/arqueo", tags=["Arqueo de Caja"])


@router.post("/abrir", response_model=schemas.ArqueoRead, status_code=201)
def abrir_caja(datos: schemas.AperturaCreate, db: Session = Depends(get_db)):
    return ArqueoService.abrir_caja(db, datos)


@router.post("/cerrar", response_model=schemas.ArqueoRead)
def cerrar_caja(datos: schemas.CierreCreate, db: Session = Depends(get_db)):
    return ArqueoService.cerrar_caja(db, datos)


@router.get("/hoy", response_model=schemas.ArqueoRead)
def estado_hoy(db: Session = Depends(get_db)):
    return ArqueoService.estado_hoy(db)


@router.get("/historial", response_model=List[schemas.ArqueoRead])
def historial(db: Session = Depends(get_db)):
    return ArqueoService.historial(db)
