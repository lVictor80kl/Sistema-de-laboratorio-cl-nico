from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

import models
import schemas
from database import get_db

router = APIRouter(
    prefix="/api/pruebas",
    tags=["Pruebas y Parámetros"]
)


# ─────────────────────────────────────────
# PRUEBAS
# ─────────────────────────────────────────

@router.post("/", response_model=schemas.Prueba, status_code=201)
def create_prueba(prueba: schemas.PruebaCreate, db: Session = Depends(get_db)):
    db_prueba = db.query(models.Prueba).filter(models.Prueba.nombre == prueba.nombre).first()
    if db_prueba:
        raise HTTPException(status_code=400, detail="Esta prueba ya existe")

    nueva_prueba = models.Prueba(**prueba.model_dump())
    db.add(nueva_prueba)
    db.commit()
    db.refresh(nueva_prueba)
    return nueva_prueba


@router.get("/", response_model=List[schemas.Prueba])
def read_pruebas(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    return db.query(models.Prueba).order_by(models.Prueba.orden_visual).offset(skip).limit(limit).all()


@router.get("/{prueba_id}", response_model=schemas.Prueba)
def read_prueba(prueba_id: int, db: Session = Depends(get_db)):
    db_prueba = db.query(models.Prueba).filter(models.Prueba.id == prueba_id).first()
    if not db_prueba:
        raise HTTPException(status_code=404, detail="Prueba no encontrada")
    return db_prueba


@router.put("/{prueba_id}", response_model=schemas.Prueba)
def update_prueba(prueba_id: int, prueba: schemas.PruebaCreate, db: Session = Depends(get_db)):
    db_prueba = db.query(models.Prueba).filter(models.Prueba.id == prueba_id).first()
    if not db_prueba:
        raise HTTPException(status_code=404, detail="Prueba no encontrada")

    # Verificar nombre duplicado solo si cambió
    if prueba.nombre != db_prueba.nombre:
        nombre_existente = db.query(models.Prueba).filter(models.Prueba.nombre == prueba.nombre).first()
        if nombre_existente:
            raise HTTPException(status_code=400, detail="Ya existe una prueba con ese nombre")

    for key, value in prueba.model_dump().items():
        setattr(db_prueba, key, value)

    db.commit()
    db.refresh(db_prueba)
    return db_prueba


@router.delete("/{prueba_id}")
def delete_prueba(prueba_id: int, db: Session = Depends(get_db)):
    db_prueba = db.query(models.Prueba).filter(models.Prueba.id == prueba_id).first()
    if not db_prueba:
        raise HTTPException(status_code=404, detail="Prueba no encontrada")
    db.delete(db_prueba)
    db.commit()
    return {"mensaje": "Prueba eliminada"}


# ─────────────────────────────────────────
# PARÁMETROS
# ─────────────────────────────────────────

@router.post("/{prueba_id}/parametros", response_model=schemas.Parametro, status_code=201)
def create_parametro(prueba_id: int, parametro: schemas.ParametroCreate, db: Session = Depends(get_db)):
    db_prueba = db.query(models.Prueba).filter(models.Prueba.id == prueba_id).first()
    if not db_prueba:
        raise HTTPException(status_code=404, detail="Prueba no encontrada")
    if parametro.prueba_id != prueba_id:
        raise HTTPException(status_code=400, detail="ID de prueba no coincide")

    nuevo_parametro = models.Parametro(**parametro.model_dump())
    db.add(nuevo_parametro)
    db.commit()
    db.refresh(nuevo_parametro)
    return nuevo_parametro


@router.get("/{prueba_id}/parametros")
def read_parametros_por_prueba(prueba_id: int, db: Session = Depends(get_db)):
    db_prueba = db.query(models.Prueba).filter(models.Prueba.id == prueba_id).first()
    if not db_prueba:
        raise HTTPException(status_code=404, detail="Prueba no encontrada")
    
    parametros = db.query(models.Parametro).filter(
        models.Parametro.prueba_id == prueba_id
    ).order_by(models.Parametro.orden_visual).all()

    # Enriquecer cada parámetro con sus rangos de referencia
    resultado = []
    for p in parametros:
        # Usar model_validate para Pydantic v2
        p_data = schemas.Parametro.model_validate(p).model_dump()
        
        rangos = db.query(models.RangoReferencia).filter(models.RangoReferencia.parametro_id == p.id).all()
        p_data["rangos"] = [schemas.RangoReferencia.model_validate(r).model_dump() for r in rangos]
        
        resultado.append(p_data)
    
    return resultado


@router.put("/parametros/{parametro_id}", response_model=schemas.Parametro)
def update_parametro(parametro_id: int, parametro: schemas.ParametroCreate, db: Session = Depends(get_db)):
    db_parametro = db.query(models.Parametro).filter(models.Parametro.id == parametro_id).first()
    if not db_parametro:
        raise HTTPException(status_code=404, detail="Parámetro no encontrado")

    for key, value in parametro.model_dump().items():
        setattr(db_parametro, key, value)

    db.commit()
    db.refresh(db_parametro)
    return db_parametro


@router.delete("/parametros/{parametro_id}")
def delete_parametro(parametro_id: int, db: Session = Depends(get_db)):
    db_parametro = db.query(models.Parametro).filter(models.Parametro.id == parametro_id).first()
    if not db_parametro:
        raise HTTPException(status_code=404, detail="Parámetro no encontrado")
    db.delete(db_parametro)
    db.commit()
    return {"mensaje": "Parámetro eliminado"}


# ─────────────────────────────────────────
# RANGOS DE REFERENCIA
# ─────────────────────────────────────────

@router.post("/parametros/{parametro_id}/rangos", response_model=schemas.RangoReferencia, status_code=201)
def create_rango(parametro_id: int, rango: schemas.RangoReferenciaCreate, db: Session = Depends(get_db)):
    db_parametro = db.query(models.Parametro).filter(models.Parametro.id == parametro_id).first()
    if not db_parametro:
        raise HTTPException(status_code=404, detail="Parámetro no encontrado")
    if rango.parametro_id != parametro_id:
        raise HTTPException(status_code=400, detail="ID de parámetro no coincide")

    nuevo_rango = models.RangoReferencia(**rango.model_dump())
    db.add(nuevo_rango)
    db.commit()
    db.refresh(nuevo_rango)
    return nuevo_rango


@router.get("/parametros/{parametro_id}/rangos", response_model=List[schemas.RangoReferencia])
def read_rangos(parametro_id: int, db: Session = Depends(get_db)):
    db_parametro = db.query(models.Parametro).filter(models.Parametro.id == parametro_id).first()
    if not db_parametro:
        raise HTTPException(status_code=404, detail="Parámetro no encontrado")
    return db.query(models.RangoReferencia).filter(
        models.RangoReferencia.parametro_id == parametro_id
    ).all()


@router.put("/rangos/{rango_id}", response_model=schemas.RangoReferencia)
def update_rango(rango_id: int, rango: schemas.RangoReferenciaCreate, db: Session = Depends(get_db)):
    db_rango = db.query(models.RangoReferencia).filter(models.RangoReferencia.id == rango_id).first()
    if not db_rango:
        raise HTTPException(status_code=404, detail="Rango no encontrado")

    for key, value in rango.model_dump().items():
        setattr(db_rango, key, value)

    db.commit()
    db.refresh(db_rango)
    return db_rango


@router.delete("/rangos/{rango_id}")
def delete_rango(rango_id: int, db: Session = Depends(get_db)):
    db_rango = db.query(models.RangoReferencia).filter(models.RangoReferencia.id == rango_id).first()
    if not db_rango:
        raise HTTPException(status_code=404, detail="Rango no encontrado")
    db.delete(db_rango)
    db.commit()
    return {"mensaje": "Rango eliminado"}
