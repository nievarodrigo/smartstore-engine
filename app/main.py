from fastapi import FastAPI
from app.database import engine
from app import models
from app.routes import productos, ventas, fiados, arqueo

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartStore Engine")

app.include_router(productos.router)
app.include_router(ventas.router)
app.include_router(fiados.router)
app.include_router(arqueo.router)

@app.get("/")
def read_root():
    return {"status": "SmartStore Engine Online"}
