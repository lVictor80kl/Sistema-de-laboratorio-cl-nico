from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
import models
from rutas import pacientes, pruebas, ordenes
from rutas import facturacion, inventario

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

app = FastAPI(title="LIS Laboratorio API", version="1.0.0")

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(pacientes.router)
app.include_router(pruebas.router)
app.include_router(ordenes.router)
app.include_router(facturacion.router)
app.include_router(inventario.router)


@app.get("/")
def root():
    return {"message": "¡API del Sistema de Laboratorio funcionando!"}
