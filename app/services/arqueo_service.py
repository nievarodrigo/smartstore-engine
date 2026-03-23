from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app import models, schemas
import datetime


class ArqueoService:

    @staticmethod
    def abrir_caja(db: Session, datos: schemas.AperturaCreate):
        hoy = datetime.date.today()
        existente = db.query(models.ArqueoCaja).filter(models.ArqueoCaja.fecha == hoy).first()
        if existente:
            raise HTTPException(status_code=400, detail="La caja ya fue abierta hoy")
        arqueo = models.ArqueoCaja(fecha=hoy, monto_apertura=datos.monto_apertura)
        db.add(arqueo)
        db.commit()
        db.refresh(arqueo)
        return arqueo

    @staticmethod
    def cerrar_caja(db: Session, datos: schemas.CierreCreate):
        hoy = datetime.date.today()
        arqueo = db.query(models.ArqueoCaja).filter(
            models.ArqueoCaja.fecha == hoy,
            models.ArqueoCaja.estado == "abierto"
        ).first()
        if not arqueo:
            raise HTTPException(status_code=404, detail="No hay caja abierta hoy")

        total_ventas = ArqueoService._ventas_del_dia(db, hoy)
        diferencia = float(datos.monto_cierre) - (float(arqueo.monto_apertura) + total_ventas)

        arqueo.monto_cierre = datos.monto_cierre
        arqueo.total_ventas = total_ventas
        arqueo.diferencia = diferencia
        arqueo.estado = "cerrado"
        db.commit()
        db.refresh(arqueo)
        return arqueo

    @staticmethod
    def estado_hoy(db: Session):
        hoy = datetime.date.today()
        arqueo = db.query(models.ArqueoCaja).filter(models.ArqueoCaja.fecha == hoy).first()
        if not arqueo:
            raise HTTPException(status_code=404, detail="No se abrió la caja hoy")
        if arqueo.estado == "abierto":
            arqueo.total_ventas = ArqueoService._ventas_del_dia(db, hoy)
        return arqueo

    @staticmethod
    def historial(db: Session):
        return (
            db.query(models.ArqueoCaja)
            .order_by(models.ArqueoCaja.fecha.desc())
            .limit(30)
            .all()
        )

    # ── helper ────────────────────────────────────────────
    @staticmethod
    def _ventas_del_dia(db: Session, fecha: datetime.date) -> float:
        resultado = db.query(func.sum(models.Venta.total)).filter(
            func.date(models.Venta.fecha_hora) == fecha
        ).scalar()
        return float(resultado or 0)
