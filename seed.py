"""
Script de seed para demo — genera datos de prueba en la base de datos.
Correr una sola vez: python seed.py
"""
import random
import datetime
from faker import Faker
from app.database import SessionLocal, engine
from app import models

fake = Faker("es_AR")
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Productos típicos de almacén de barrio ────────────────────────────────────
PRODUCTOS = [
    ("Yerba Mate Taragüi 500g",     850.00,  "Infusiones",   45),
    ("Yerba Mate Rosamonte 1kg",   1350.00,  "Infusiones",   30),
    ("Aceite Girasol Natura 1.5L", 1200.00,  "Aceites",      25),
    ("Aceite de Oliva Cocinero 500ml", 980.00, "Aceites",    15),
    ("Fideos Macarrón Don Vicente 500g", 420.00, "Pastas",   60),
    ("Fideos Tallarín Lucchetti 500g",  450.00, "Pastas",    40),
    ("Arroz Gallo 1kg",             680.00,  "Granos",       50),
    ("Harina 000 Pureza 1kg",       530.00,  "Harinas",      35),
    ("Harina 0000 Canuelas 1kg",    560.00,  "Harinas",      30),
    ("Azúcar Ledesma 1kg",          620.00,  "Almacén",      55),
    ("Sal Fina La Panera 500g",     280.00,  "Almacén",      70),
    ("Tomate Triturado Arcor 520g", 490.00,  "Conservas",    40),
    ("Arvejas Arcor 300g",          380.00,  "Conservas",    35),
    ("Atún al Natural Coto 170g",   550.00,  "Conservas",    25),
    ("Galletitas Oreo 120g",        450.00,  "Golosinas",    60),
    ("Galletitas Bagley Surtido 250g", 390.00, "Golosinas",  45),
    ("Dulce de Leche La Serenísima 400g", 750.00, "Lácteos", 20),
    ("Leche Entera La Serenísima 1L",   430.00, "Lácteos",   30),
    ("Jabón en Polvo Skip 500g",    980.00,  "Limpieza",     20),
    ("Lavandina Ayudín 1L",         380.00,  "Limpieza",     25),
]

print("Cargando productos...")
productos_db = []
for nombre, precio, categoria, stock in PRODUCTOS:
    p = models.Producto(nombre=nombre, precio=precio, categoria=categoria, stock=stock)
    db.add(p)
    productos_db.append(p)
db.commit()
for p in productos_db:
    db.refresh(p)
print(f"  {len(productos_db)} productos creados.")

# ── Ventas de los últimos 30 días ─────────────────────────────────────────────
print("Cargando ventas...")
hoy = datetime.date.today()
metodos = ["efectivo", "efectivo", "efectivo", "débito", "transferencia"]

for _ in range(60):
    dias_atras = random.randint(0, 30)
    fecha = datetime.datetime.combine(
        hoy - datetime.timedelta(days=dias_atras),
        datetime.time(random.randint(8, 21), random.randint(0, 59))
    )
    producto = random.choice(productos_db)
    cantidad = random.randint(1, 4)
    total = float(producto.precio) * cantidad

    venta = models.Venta(
        fecha_hora=fecha,
        total=total,
        metodo_pago=random.choice(metodos)
    )
    db.add(venta)
    db.flush()

    detalle = models.DetalleVenta(
        venta_id=venta.id,
        producto_id=producto.id,
        cantidad=cantidad,
        precio_unitario=producto.precio
    )
    db.add(detalle)

db.commit()
print("  60 ventas creadas.")

# ── Deudores con historial de fiados ─────────────────────────────────────────
print("Cargando deudores...")
DEUDORES = [
    ("Marcelo Ríos",    "1134567890"),
    ("Ana González",    "1156789012"),
    ("Roberto Fuentes", None),
    ("Claudia Peralta",  "1178901234"),
    ("Diego Mamani",    "1190123456"),
]

for nombre, tel in DEUDORES:
    deudor = models.Deudor(nombre=nombre, telefono=tel)
    db.add(deudor)
    db.flush()

    # Entre 2 y 5 cargos
    for _ in range(random.randint(2, 5)):
        dias = random.randint(1, 20)
        producto = random.choice(productos_db)
        db.add(models.MovimientoFiado(
            deudor_id=deudor.id,
            tipo="cargo",
            monto=round(float(producto.precio) * random.randint(1, 3), 2),
            descripcion=producto.nombre,
            fecha=datetime.datetime.now() - datetime.timedelta(days=dias)
        ))

    # Un pago parcial
    deuda_aprox = float(producto.precio) * random.randint(1, 2)
    pago = round(deuda_aprox * random.uniform(0.3, 0.6), 2)
    db.add(models.MovimientoFiado(
        deudor_id=deudor.id,
        tipo="pago",
        monto=pago,
        descripcion="Pago parcial",
        fecha=datetime.datetime.now() - datetime.timedelta(days=random.randint(0, 3))
    ))

db.commit()
print(f"  {len(DEUDORES)} deudores creados.")

# ── Arqueo de caja de hoy ─────────────────────────────────────────────────────
print("Creando arqueo de hoy...")
arqueo_existente = db.query(models.ArqueoCaja).filter(
    models.ArqueoCaja.fecha == hoy
).first()

if not arqueo_existente:
    db.add(models.ArqueoCaja(fecha=hoy, monto_apertura=15000.00, estado="abierto"))
    db.commit()
    print("  Arqueo abierto con $15.000 de apertura.")
else:
    print("  Ya existe un arqueo para hoy, se omite.")

db.close()
print("\n✓ Seed completado. Levantá el servidor y probá en http://localhost:8000/docs")
