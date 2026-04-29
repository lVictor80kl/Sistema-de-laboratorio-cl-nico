from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
from database import get_db

router = APIRouter(
    prefix="/api/pacientes",
    tags=["Pacientes"]
)


# --- CREAR PACIENTE ---
@router.post("/", response_model=schemas.Paciente, status_code=201)
def create_paciente(paciente: schemas.PacienteCreate, db: Session = Depends(get_db)):
    db_paciente = db.query(models.Paciente).filter(models.Paciente.cedula == paciente.cedula).first()
    if db_paciente:
        raise HTTPException(status_code=400, detail="Cédula ya registrada")

    nuevo_paciente = models.Paciente(**paciente.model_dump())
    db.add(nuevo_paciente)
    db.commit()
    db.refresh(nuevo_paciente)
    return nuevo_paciente


# --- LISTAR PACIENTES (con búsqueda opcional por nombre, apellido o cédula) ---
@router.get("/", response_model=List[schemas.Paciente])
def read_pacientes(
    skip: int = 0,
    limit: int = 100,
    buscar: Optional[str] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.Paciente)

    if buscar:
        termino = f"%{buscar}%"
        query = query.filter(
            models.Paciente.nombre.ilike(termino) |
            models.Paciente.apellido.ilike(termino) |
            models.Paciente.cedula.ilike(termino)
        )

    pacientes = query.offset(skip).limit(limit).all()
    return pacientes


# --- OBTENER UN PACIENTE POR ID ---
@router.get("/{paciente_id}", response_model=schemas.Paciente)
def read_paciente(paciente_id: int, db: Session = Depends(get_db)):
    db_paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if db_paciente is None:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")
    return db_paciente


# --- ACTUALIZAR PACIENTE COMPLETO (PUT) ---
@router.put("/{paciente_id}", response_model=schemas.Paciente)
def update_paciente(paciente_id: int, paciente: schemas.PacienteCreate, db: Session = Depends(get_db)):
    db_paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if db_paciente is None:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if paciente.cedula != db_paciente.cedula:
        cedula_existente = db.query(models.Paciente).filter(
            models.Paciente.cedula == paciente.cedula
        ).first()
        if cedula_existente:
            raise HTTPException(status_code=400, detail="Cédula ya registrada por otro paciente")

    for key, value in paciente.model_dump().items():
        setattr(db_paciente, key, value)

    db.commit()
    db.refresh(db_paciente)
    return db_paciente


# --- ACTUALIZAR PACIENTE PARCIAL (PATCH) ---
@router.patch("/{paciente_id}", response_model=schemas.Paciente)
def partial_update_paciente(paciente_id: int, paciente: schemas.PacienteUpdate, db: Session = Depends(get_db)):
    db_paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if db_paciente is None:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    if paciente.cedula and paciente.cedula != db_paciente.cedula:
        cedula_existente = db.query(models.Paciente).filter(
            models.Paciente.cedula == paciente.cedula
        ).first()
        if cedula_existente:
            raise HTTPException(status_code=400, detail="Cédula ya registrada por otro paciente")

    datos_actualizados = paciente.model_dump(exclude_unset=True)
    for key, value in datos_actualizados.items():
        setattr(db_paciente, key, value)

    db.commit()
    db.refresh(db_paciente)
    return db_paciente


# --- ELIMINAR PACIENTE ---
@router.delete("/{paciente_id}")
def delete_paciente(paciente_id: int, db: Session = Depends(get_db)):
    db_paciente = db.query(models.Paciente).filter(models.Paciente.id == paciente_id).first()
    if db_paciente is None:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    db.delete(db_paciente)
    db.commit()
    return {"mensaje": "Paciente eliminado correctamente"}