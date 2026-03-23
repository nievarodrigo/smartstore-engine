from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.database import engine
from app import models
from app.routes import productos, ventas, fiados, arqueo

models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="SmartStore Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(productos.router)
app.include_router(ventas.router)
app.include_router(fiados.router)
app.include_router(arqueo.router)

@app.get("/")
def read_root():
    return {"status": "SmartStore Engine Online"}
