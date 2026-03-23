"""
Script de seed para demo — resetea la BD y genera un mes completo de datos.
Uso: python seed.py
"""
import random
import datetime
from app.database import SessionLocal, engine
from app import models

# Resetear y recrear tablas
print("Reseteando base de datos...")
models.Base.metadata.drop_all(bind=engine)
models.Base.metadata.create_all(bind=engine)
db = SessionLocal()

# ── Productos con código de barras ────────────────────────────────────────────
PRODUCTOS = [
    ("Yerba Mate Taragüi 500g",           850.00,  "Infusiones",  45, "7790580000010"),
    ("Yerba Mate Rosamonte 1kg",          1350.00,  "Infusiones",  30, "7790580000027"),
    ("Aceite Girasol Natura 1.5L",        1200.00,  "Aceites",     25, "7790580000034"),
    ("Aceite de Oliva Cocinero 500ml",     980.00,  "Aceites",     15, "7790580000041"),
    ("Fideos Macarrón Don Vicente 500g",   420.00,  "Pastas",      60, "7790580000058"),
    ("Fideos Tallarín Lucchetti 500g",     450.00,  "Pastas",      40, "7790580000065"),
    ("Arroz Gallo 1kg",                    680.00,  "Granos",      50, "7790580000072"),
    ("Harina 000 Pureza 1kg",              530.00,  "Harinas",     35, "7790580000089"),
    ("Harina 0000 Canuelas 1kg",           560.00,  "Harinas",     30, "7790580000096"),
    ("Azúcar Ledesma 1kg",                 620.00,  "Almacén",     55, "7790580000102"),
    ("Sal Fina La Panera 500g",            280.00,  "Almacén",     70, "7790580000119"),
    ("Tomate Triturado Arcor 520g",        490.00,  "Conservas",   40, "7790580000126"),
    ("Arvejas Arcor 300g",                 380.00,  "Conservas",   35, "7790580000133"),
    ("Atún al Natural Coto 170g",          550.00,  "Conservas",   25, "7790580000140"),
    ("Galletitas Oreo 120g",               450.00,  "Golosinas",   60, "7790580000157"),
    ("Galletitas Bagley Surtido 250g",     390.00,  "Golosinas",   45, "7790580000164"),
    ("Dulce de Leche La Serenísima 400g",  750.00,  "Lácteos",     20, "7790580000171"),
    ("Leche Entera La Serenísima 1L",      430.00,  "Lácteos",     30, "7790580000188"),
    ("Jabón en Polvo Skip 500g",           980.00,  "Limpieza",    20, "7790580000195"),
    ("Lavandina Ayudín 1L",                380.00,  "Limpieza",    25, "7790580000201"),
]

print("Cargando productos...")
productos_db = []
for nombre, precio, categoria, stock, barcode in PRODUCTOS:
    p = models.Producto(
        nombre=nombre, precio=precio, categoria=categoria,
        stock=stock, codigo_barras=barcode
    )
    db.add(p)
    productos_db.append(p)
db.commit()
for p in productos_db:
    db.refresh(p)
print(f"  {len(productos_db)} productos con código de barras.")

# ── Ventas del último mes (más realistas) ─────────────────────────────────────
print("Cargando ventas del mes...")
hoy = datetime.date.today()
metodos = ["efectivo", "efectivo", "efectivo", "efectivo", "débito", "transferencia"]

# Productos más populares (se venden más seguido)
populares = productos_db[:10]
resto = productos_db[10:]

total_ventas = 0
for dias_atras in range(30, -1, -1):
    fecha_dia = hoy - datetime.timedelta(days=dias_atras)
    dia_semana = fecha_dia.weekday()  # 0=lunes, 6=domingo

    # Más ventas los viernes (4), sábados (5) y domingos (6)
    if dia_semana in (4, 5, 6):
        cantidad_ventas_dia = random.randint(12, 22)
    elif dia_semana in (0, 1):
        cantidad_ventas_dia = random.randint(5, 10)
    else:
        cantidad_ventas_dia = random.randint(7, 14)

    for _ in range(cantidad_ventas_dia):
        hora = datetime.time(random.randint(8, 21), random.randint(0, 59))
        fecha_hora = datetime.datetime.combine(fecha_dia, hora)

        # Carrito de 1 a 3 productos
        n_items = random.choices([1, 2, 3], weights=[60, 30, 10])[0]
        items_pool = random.choices(populares, k=n_items) if random.random() < 0.7 else random.choices(productos_db, k=n_items)

        # Agrupar items por producto (evitar duplicados en el mismo carrito)
        carrito = {}
        for prod in items_pool:
            if prod.id in carrito:
                carrito[prod.id]["cantidad"] += 1
            else:
                carrito[prod.id] = {"producto": prod, "cantidad": 1}

        total = sum(float(v["producto"].precio) * v["cantidad"] for v in carrito.values())

        venta = models.Venta(
            fecha_hora=fecha_hora,
            total=total,
            metodo_pago=random.choice(metodos)
        )
        db.add(venta)
        db.flush()

        for item in carrito.values():
            db.add(models.DetalleVenta(
                venta_id=venta.id,
                producto_id=item["producto"].id,
                cantidad=item["cantidad"],
                precio_unitario=item["producto"].precio
            ))
        total_ventas += 1

db.commit()
print(f"  {total_ventas} ventas generadas con variación por día de semana.")

# ── Deudores con historial de fiados ─────────────────────────────────────────
print("Cargando deudores...")
DEUDORES = [
    ("Marcelo Ríos",    "1134567890"),
    ("Ana González",    "1156789012"),
    ("Roberto Fuentes", None),
    ("Claudia Peralta", "1178901234"),
    ("Diego Mamani",    "1190123456"),
]

for nombre, tel in DEUDORES:
    deudor = models.Deudor(nombre=nombre, telefono=tel)
    db.add(deudor)
    db.flush()

    acumulado = 0.0
    for _ in range(random.randint(3, 6)):
        dias = random.randint(2, 25)
        prod = random.choice(productos_db)
        monto = round(float(prod.precio) * random.randint(1, 3), 2)
        acumulado += monto
        db.add(models.MovimientoFiado(
            deudor_id=deudor.id, tipo="cargo", monto=monto,
            descripcion=prod.nombre,
            fecha=datetime.datetime.now() - datetime.timedelta(days=dias)
        ))

    # Pago parcial que no cubre toda la deuda
    pago = round(acumulado * random.uniform(0.2, 0.5), 2)
    db.add(models.MovimientoFiado(
        deudor_id=deudor.id, tipo="pago", monto=pago,
        descripcion="Pago parcial",
        fecha=datetime.datetime.now() - datetime.timedelta(days=random.randint(0, 5))
    ))

db.commit()
print(f"  {len(DEUDORES)} deudores con historial.")

# ── Arqueos de los últimos 7 días (cerrados) + hoy abierto ───────────────────
print("Cargando arqueos...")
for i in range(7, 0, -1):
    fecha = hoy - datetime.timedelta(days=i)
    apertura = random.uniform(10000, 20000)
    ventas_dia = db.execute(
        __import__("sqlalchemy").text(
            "SELECT COALESCE(SUM(total),0) FROM ventas WHERE DATE(fecha_hora)=:f"
        ), {"f": fecha}
    ).scalar()
    cierre_real = apertura + float(ventas_dia) + random.uniform(-500, 500)
    diferencia = cierre_real - (apertura + float(ventas_dia))
    db.add(models.ArqueoCaja(
        fecha=fecha,
        monto_apertura=round(apertura, 2),
        monto_cierre=round(cierre_real, 2),
        total_ventas=round(float(ventas_dia), 2),
        diferencia=round(diferencia, 2),
        estado="cerrado"
    ))

db.add(models.ArqueoCaja(fecha=hoy, monto_apertura=15000.00, estado="abierto"))
db.commit()
print("  7 arqueos cerrados + caja de hoy abierta.")

db.close()
print("\n✓ Seed completado. Levantá el servidor y probá en http://localhost:5173")
