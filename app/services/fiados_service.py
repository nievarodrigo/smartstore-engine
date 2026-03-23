from sqlalchemy.orm import Session
from sqlalchemy import func
from fastapi import HTTPException
from app import models, schemas


class FiadosService:

    @staticmethod
    def crear_deudor(db: Session, datos: schemas.DeudorCreate):
        deudor = models.Deudor(nombre=datos.nombre, telefono=datos.telefono)
        db.add(deudor)
        db.commit()
        db.refresh(deudor)
        return FiadosService._enrich(db, deudor)

    @staticmethod
    def listar_deudores(db: Session):
        deudores = db.query(models.Deudor).order_by(models.Deudor.nombre).all()
        return [FiadosService._enrich(db, d) for d in deudores]

    @staticmethod
    def obtener_deudor(db: Session, deudor_id: int):
        deudor = db.query(models.Deudor).filter(models.Deudor.id == deudor_id).first()
        if not deudor:
            raise HTTPException(status_code=404, detail="Deudor no encontrado")
        return FiadosService._enrich(db, deudor)

    @staticmethod
    def agregar_cargo(db: Session, deudor_id: int, datos: schemas.MovimientoCreate):
        FiadosService._verificar_deudor(db, deudor_id)
        mov = models.MovimientoFiado(
            deudor_id=deudor_id,
            tipo="cargo",
            monto=datos.monto,
            descripcion=datos.descripcion
        )
        db.add(mov)
        db.commit()
        db.refresh(mov)
        return mov

    @staticmethod
    def registrar_pago(db: Session, deudor_id: int, datos: schemas.MovimientoCreate):
        deudor = FiadosService._verificar_deudor(db, deudor_id)
        total_adeudado = FiadosService._calcular_deuda(db, deudor_id)
        if datos.monto > total_adeudado:
            raise HTTPException(
                status_code=400,
                detail=f"El pago ({datos.monto}) supera la deuda actual ({total_adeudado:.2f})"
            )
        mov = models.MovimientoFiado(
            deudor_id=deudor_id,
            tipo="pago",
            monto=datos.monto,
            descripcion=datos.descripcion
        )
        db.add(mov)
        db.commit()
        db.refresh(mov)
        return mov

    @staticmethod
    def historial(db: Session, deudor_id: int):
        FiadosService._verificar_deudor(db, deudor_id)
        return (
            db.query(models.MovimientoFiado)
            .filter(models.MovimientoFiado.deudor_id == deudor_id)
            .order_by(models.MovimientoFiado.fecha.desc())
            .all()
        )

    # ── helpers ──────────────────────────────────────────
    @staticmethod
    def _verificar_deudor(db: Session, deudor_id: int):
        deudor = db.query(models.Deudor).filter(models.Deudor.id == deudor_id).first()
        if not deudor:
            raise HTTPException(status_code=404, detail="Deudor no encontrado")
        return deudor

    @staticmethod
    def _calcular_deuda(db: Session, deudor_id: int) -> float:
        resultado = db.query(
            func.sum(
                func.IF(
                    models.MovimientoFiado.tipo == "cargo",
                    models.MovimientoFiado.monto,
                    -models.MovimientoFiado.monto
                )
            )
        ).filter(models.MovimientoFiado.deudor_id == deudor_id).scalar()
        return float(resultado or 0)

    @staticmethod
    def _enrich(db: Session, deudor: models.Deudor) -> dict:
        return {
            "id": deudor.id,
            "nombre": deudor.nombre,
            "telefono": deudor.telefono,
            "total_adeudado": FiadosService._calcular_deuda(db, deudor.id),
            "fecha_creacion": deudor.fecha_creacion,
        }
