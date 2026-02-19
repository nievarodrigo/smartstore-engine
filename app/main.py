from fastapi import FastAPI
from app.database import engine
from app import models
from app.database import engine
from app import models
# Si todavía no tenés código real en productos.py o ventas.py,
# comentá estas líneas para que el servidor levante sin errores:
from app.routes import productos, ventas 

# Crea las tablas automáticamente
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartStore Engine")

app.include_router(productos.router)
app.include_router(ventas.router)

@app.get("/")
def read_root():
    return {"status": "SmartStore Engine Online", "club": "6 AM"}

from fastapi import FastAPI
from app.database import engine
from app import models
from app.routes import productos, ventas  # Descomentado

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartStore Engine")

app.include_router(productos.router) # Descomentado
app.include_router(ventas.router)    # Descomentado

@app.get("/")
def read_root():
    return {"status": "SmartStore Engine Online", "club": "6 AM"}