from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import date

import models
import schemas
from database import get_db

router = APIRouter(
    prefix="/api/facturacion",
    tags=["Facturación / BCV"]
)


# ─── TASA BCV ──────────────────────────────────────────────────────────────

@router.get("/tasa", response_model=schemas.TasaBCV)
def get_tasa_actual(db: Session = Depends(get_db)):
    """Devuelve la tasa BCV más reciente registrada."""
    ultima = db.query(models.TasaBCV).order_by(desc(models.TasaBCV.id)).first()
    if not ultima:
        raise HTTPException(status_code=404, detail="No hay tasa registrada aún")
    return ultima


@router.post("/tasa", response_model=schemas.TasaBCV, status_code=201)
def registrar_tasa(payload: schemas.TasaBCVCreate, db: Session = Depends(get_db)):
    """Registra una nueva tasa BCV (manual o automática)."""
    nueva = models.TasaBCV(
        tasa=payload.tasa,
        fecha=payload.fecha,
        slot=payload.slot or "manual"
    )
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return nueva


@router.get("/tasa/historial", response_model=List[schemas.TasaBCV])
def get_historial_tasas(limit: int = 10, db: Session = Depends(get_db)):
    """Devuelve las últimas N tasas BCV registradas."""
    return db.query(models.TasaBCV).order_by(desc(models.TasaBCV.id)).limit(limit).all()


# ─── ÓRDENES PARA FACTURACIÓN ──────────────────────────────────────────────

@router.get("/ordenes", response_model=List[schemas.OrdenFacturacion])
def get_ordenes_facturacion(
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db)
):
    """Lista todas las órdenes enriquecidas con datos del paciente."""
    ordenes = (
        db.query(models.OrdenExamen)
        .order_by(desc(models.OrdenExamen.fecha))
        .offset(skip)
        .limit(limit)
        .all()
    )

    resultado = []
    for o in ordenes:
        paciente = db.query(models.Paciente).filter(models.Paciente.id == o.paciente_id).first()
        nombre_completo = f"{paciente.nombre} {paciente.apellido}" if paciente else "Desconocido"
        cedula = paciente.cedula if paciente else "-"
        resultado.append(schemas.OrdenFacturacion(
            id=o.id,
            paciente_id=o.paciente_id,
            paciente_nombre=nombre_completo,
            paciente_cedula=cedula,
            fecha=o.fecha,
            estado_pago=o.estado_pago,
            monto_usd=o.monto_usd,
            monto_bs=o.monto_bs,
        ))
    return resultado


@router.patch("/ordenes/{orden_id}/pagar", response_model=schemas.OrdenExamen)
def marcar_pagado(orden_id: int, db: Session = Depends(get_db)):
    """Marca una orden como pagada."""
    orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    orden.estado_pago = models.EstadoPagoEnum.PAGADO
    db.commit()
    db.refresh(orden)
    return orden
