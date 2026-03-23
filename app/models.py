from sqlalchemy import Column, Integer, String, Numeric, ForeignKey, DateTime, Date, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.ext.declarative import declarative_base
import datetime

Base = declarative_base()


class Producto(Base):
    __tablename__ = "productos"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    precio = Column(Numeric(10, 2), nullable=False)
    stock = Column(Integer, default=0)
    categoria = Column(String(50))

    detalles = relationship("DetalleVenta", back_populates="producto")


class Venta(Base):
    __tablename__ = "ventas"

    id = Column(Integer, primary_key=True, index=True)
    fecha_hora = Column(DateTime, default=datetime.datetime.utcnow)
    total = Column(Numeric(10, 2), nullable=False)
    metodo_pago = Column(String(20), default="efectivo")

    detalles = relationship("DetalleVenta", back_populates="venta")


class DetalleVenta(Base):
    __tablename__ = "detalle_ventas"

    id = Column(Integer, primary_key=True, index=True)
    venta_id = Column(Integer, ForeignKey("ventas.id"))
    producto_id = Column(Integer, ForeignKey("productos.id"))
    cantidad = Column(Integer, nullable=False)
    precio_unitario = Column(Numeric(10, 2), nullable=False)

    venta = relationship("Venta", back_populates="detalles")
    producto = relationship("Producto", back_populates="detalles")


class Deudor(Base):
    __tablename__ = "deudores"

    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String(100), nullable=False)
    telefono = Column(String(20), nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.datetime.utcnow)

    movimientos = relationship("MovimientoFiado", back_populates="deudor")


class MovimientoFiado(Base):
    __tablename__ = "movimientos_fiado"

    id = Column(Integer, primary_key=True, index=True)
    deudor_id = Column(Integer, ForeignKey("deudores.id"))
    tipo = Column(Enum("cargo", "pago"), nullable=False)
    monto = Column(Numeric(10, 2), nullable=False)
    descripcion = Column(String(200), nullable=True)
    fecha = Column(DateTime, default=datetime.datetime.utcnow)

    deudor = relationship("Deudor", back_populates="movimientos")


class ArqueoCaja(Base):
    __tablename__ = "arqueos_caja"

    id = Column(Integer, primary_key=True, index=True)
    fecha = Column(Date, nullable=False, unique=True)
    monto_apertura = Column(Numeric(10, 2), nullable=False)
    monto_cierre = Column(Numeric(10, 2), nullable=True)
    total_ventas = Column(Numeric(10, 2), nullable=True)
    diferencia = Column(Numeric(10, 2), nullable=True)
    estado = Column(Enum("abierto", "cerrado"), default="abierto")
