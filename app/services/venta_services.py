# app/services/ventas_service.py
from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import models, schemas
from datetime import datetime, date
from typing import Optional
from sqlalchemy import func

class VentasService:
    @staticmethod
    def procesar_registro_venta(db: Session, pedido: schemas.VentaCreate):
        # 1. Buscar producto (Escaneo)
        producto = db.query(models.Producto).filter(models.Producto.id == pedido.producto_id).first()
        if not producto:
            raise HTTPException(status_code=404, detail="Producto no encontrado")

        # 2. Validar stock
        if producto.stock < pedido.cantidad:
            raise HTTPException(status_code=400, detail="Stock insuficiente")

        # 3. Lógica de dinero
        total = producto.precio * pedido.cantidad
        vuelto = pedido.pago_con - float(total)
        
        if vuelto < 0:
            raise HTTPException(status_code=400, detail=f"Faltan {abs(vuelto)} para completar el pago")

        # 4. Registrar la venta principal
        nueva_venta = models.Venta(total=total, metodo_pago="efectivo")
        db.add(nueva_venta)
        db.flush()  # Para obtener el ID de la venta antes del commit final

        # 5. Registrar el detalle de la venta (Fundamental para estadísticas)
        detalle = models.DetalleVenta(
            venta_id=nueva_venta.id,
            producto_id=producto.id,
            cantidad=pedido.cantidad,
            precio_unitario=producto.precio
        )
        db.add(detalle)

        # 6. Descontar stock
        producto.stock -= pedido.cantidad

        # 7. Confirmar cambios en la DB
        db.commit()
        db.refresh(nueva_venta)

        return {
            "mensaje": "Venta exitosa",
            "producto": producto.nombre,
            "total": total,
            "vuelto": vuelto,
            "stock_restante": producto.stock,
            "venta_id": nueva_venta.id
        }
    
    @staticmethod
    def obtener_historial(db: Session, fecha_inicio: Optional[datetime] = None, fecha_fin: Optional[datetime] = None):
        query = db.query(models.Venta)
        
        if fecha_inicio:
            query = query.filter(models.Venta.fecha_hora >= fecha_inicio)
        if fecha_fin:
            query = query.filter(models.Venta.fecha_hora <= fecha_fin)
            
        return query.order_by(models.Venta.fecha_hora.desc()).all()
    
    @staticmethod
    def obtener_kpis_dia(db: Session):
        hoy = date.today()
        resultado = db.query(
            func.sum(models.Venta.total).label("total"),
            func.count(models.Venta.id).label("cantidad")
        ).filter(func.date(models.Venta.fecha_hora) == hoy).first()
        
        return {
            "total_recaudado": resultado.total or 0,
            "cantidad_ventas": resultado.cantidad or 0
        }

    @staticmethod
    def obtener_datos_grafico(db: Session, inicio: date, fin: date):
        resultados = db.query(
            func.date(models.Venta.fecha_hora).label("fecha"),
            func.sum(models.Venta.total).label("total")
        ).filter(
            func.date(models.Venta.fecha_hora) >= inicio,
            func.date(models.Venta.fecha_hora) <= fin
        ).group_by("fecha").order_by("fecha").all()
        
        return [{"fecha": str(r.fecha), "total": float(r.total)} for r in resultados]

    @staticmethod
    def producto_mas_vendido(db: Session, inicio: date, fin: date):
        resultado = db.query(
            models.Producto.nombre,
            func.sum(models.DetalleVenta.cantidad).label("total_vendido")
        ).join(models.DetalleVenta).join(models.Venta).filter(
            func.date(models.Venta.fecha_hora) >= inicio,
            func.date(models.Venta.fecha_hora) <= fin
        ).group_by(models.Producto.id).order_by(func.sum(models.DetalleVenta.cantidad).desc()).first()
        
        if not resultado:
            return {"producto_nombre": "N/A", "cantidad_total": 0}
            
        return {"producto_nombre": resultado.nombre, "cantidad_total": resultado.total_vendido}