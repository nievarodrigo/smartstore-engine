from sqlalchemy.orm import Session
from fastapi import HTTPException
from app import models, schemas
from datetime import datetime, date
from typing import Optional
from sqlalchemy import func


class VentasService:

    @staticmethod
    def procesar_registro_venta(db: Session, pedido: schemas.VentaCreate):
        # 1. Validar todos los productos y stock antes de tocar nada
        productos_map = {}
        total = 0.0
        for item in pedido.items:
            producto = db.query(models.Producto).filter(models.Producto.id == item.producto_id).first()
            if not producto:
                raise HTTPException(status_code=404, detail=f"Producto {item.producto_id} no encontrado")
            if producto.stock < item.cantidad:
                raise HTTPException(status_code=400, detail=f"Stock insuficiente para {producto.nombre}")
            productos_map[item.producto_id] = producto
            total += float(producto.precio) * item.cantidad

        # 2. Validar pago (solo para efectivo/débito, no fiado)
        metodo = pedido.metodo_pago
        vuelto = 0.0
        if metodo != "fiado":
            vuelto = pedido.pago_con - total
            if vuelto < 0:
                raise HTTPException(status_code=400, detail=f"Pago insuficiente. Faltan ${abs(vuelto):.2f}")
        else:
            if not pedido.deudor_id:
                raise HTTPException(status_code=400, detail="Fiado requiere seleccionar un deudor")

        # 3. Crear la venta
        nueva_venta = models.Venta(total=total, metodo_pago=metodo)
        db.add(nueva_venta)
        db.flush()

        # 4. Detalles y descuento de stock
        for item in pedido.items:
            producto = productos_map[item.producto_id]
            db.add(models.DetalleVenta(
                venta_id=nueva_venta.id,
                producto_id=producto.id,
                cantidad=item.cantidad,
                precio_unitario=producto.precio
            ))
            producto.stock -= item.cantidad

        # 5. Si es fiado, crear cargo automático al deudor
        if metodo == "fiado":
            deudor = db.query(models.Deudor).filter(models.Deudor.id == pedido.deudor_id).first()
            if not deudor:
                raise HTTPException(status_code=404, detail="Deudor no encontrado")
            nombres = ", ".join(productos_map[i.producto_id].nombre for i in pedido.items)
            db.add(models.MovimientoFiado(
                deudor_id=deudor.id,
                tipo="cargo",
                monto=total,
                descripcion=f"Venta #{nueva_venta.id}: {nombres}"
            ))

        db.commit()
        db.refresh(nueva_venta)

        return {
            "mensaje": "Venta registrada",
            "venta_id": nueva_venta.id,
            "total": total,
            "vuelto": vuelto,
            "metodo_pago": metodo,
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
        return {"total_recaudado": resultado.total or 0, "cantidad_ventas": resultado.cantidad or 0}

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

    @staticmethod
    def top_productos(db: Session, inicio: date, fin: date, limite: int = 8):
        resultados = db.query(
            models.Producto.nombre,
            func.sum(models.DetalleVenta.cantidad).label("total_vendido")
        ).join(models.DetalleVenta).join(models.Venta).filter(
            func.date(models.Venta.fecha_hora) >= inicio,
            func.date(models.Venta.fecha_hora) <= fin
        ).group_by(models.Producto.id).order_by(func.sum(models.DetalleVenta.cantidad).desc()).limit(limite).all()
        return [{"producto_nombre": r.nombre, "cantidad_total": int(r.total_vendido)} for r in resultados]
