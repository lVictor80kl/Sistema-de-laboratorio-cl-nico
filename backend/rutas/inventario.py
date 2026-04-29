from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import date

import models
import schemas
from database import get_db

router = APIRouter(
    prefix="/api/inventario",
    tags=["Inventario"]
)


# ═══════════════════════════════════════════════════════════════
# CATEGORÍAS DE INSUMOS
# ═══════════════════════════════════════════════════════════════

@router.post("/categorias", response_model=schemas.CategoriaInsumo, status_code=201)
def create_categoria(categoria: schemas.CategoriaInsumoCreate, db: Session = Depends(get_db)):
    db_cat = models.CategoriaInsumo(**categoria.model_dump())
    db.add(db_cat)
    db.commit()
    db.refresh(db_cat)
    return db_cat


@router.get("/categorias", response_model=List[schemas.CategoriaInsumo])
def read_categorias(db: Session = Depends(get_db)):
    return db.query(models.CategoriaInsumo).order_by(models.CategoriaInsumo.nombre).all()


@router.delete("/categorias/{categoria_id}")
def delete_categoria(categoria_id: int, db: Session = Depends(get_db)):
    db_cat = db.query(models.CategoriaInsumo).filter(models.CategoriaInsumo.id == categoria_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    db.delete(db_cat)
    db.commit()
    return {"mensaje": "Categoría eliminada"}


# ═══════════════════════════════════════════════════════════════
# INSUMOS
# ═══════════════════════════════════════════════════════════════

@router.post("/insumos", response_model=schemas.Insumo, status_code=201)
def create_insumo(insumo: schemas.InsumoCreate, db: Session = Depends(get_db)):
    db_cat = db.query(models.CategoriaInsumo).filter(models.CategoriaInsumo.id == insumo.categoria_id).first()
    if not db_cat:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    db_insumo = models.Insumo(**insumo.model_dump())
    db.add(db_insumo)
    db.commit()
    db.refresh(db_insumo)
    return db_insumo


@router.get("/insumos", response_model=List[schemas.Insumo])
def read_insumos(
    categoria_id: Optional[int] = None,
    solo_activos: bool = True,
    db: Session = Depends(get_db)
):
    query = db.query(models.Insumo)
    if categoria_id:
        query = query.filter(models.Insumo.categoria_id == categoria_id)
    if solo_activos:
        query = query.filter(models.Insumo.activo == True)
    return query.order_by(models.Insumo.nombre).all()


@router.get("/insumos/{insumo_id}", response_model=schemas.Insumo)
def read_insumo(insumo_id: int, db: Session = Depends(get_db)):
    db_insumo = db.query(models.Insumo).filter(models.Insumo.id == insumo_id).first()
    if not db_insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    return db_insumo


@router.patch("/insumos/{insumo_id}", response_model=schemas.Insumo)
def update_insumo(insumo_id: int, insumo: schemas.InsumoUpdate, db: Session = Depends(get_db)):
    db_insumo = db.query(models.Insumo).filter(models.Insumo.id == insumo_id).first()
    if not db_insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    
    datos = insumo.model_dump(exclude_unset=True)
    for key, value in datos.items():
        setattr(db_insumo, key, value)
    
    db.commit()
    db.refresh(db_insumo)
    return db_insumo


@router.delete("/insumos/{insumo_id}")
def delete_insumo(insumo_id: int, db: Session = Depends(get_db)):
    db_insumo = db.query(models.Insumo).filter(models.Insumo.id == insumo_id).first()
    if not db_insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    db.delete(db_insumo)
    db.commit()
    return {"mensaje": "Insumo eliminado"}


# ═══════════════════════════════════════════════════════════════
# INSUMOS POR PRUEBA (consumo por examen)
# ═══════════════════════════════════════════════════════════════

@router.post("/insumos-prueba", response_model=schemas.InsumoPrueba, status_code=201)
def create_insumo_prueba(rel: schemas.InsumoPruebaCreate, db: Session = Depends(get_db)):
    db_prueba = db.query(models.Prueba).filter(models.Prueba.id == rel.prueba_id).first()
    if not db_prueba:
        raise HTTPException(status_code=404, detail="Prueba no encontrada")
    
    db_insumo = db.query(models.Insumo).filter(models.Insumo.id == rel.insumo_id).first()
    if not db_insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    
    db_rel = models.InsumoPrueba(**rel.model_dump())
    db.add(db_rel)
    db.commit()
    db.refresh(db_rel)
    return db_rel


@router.get("/pruebas/{prueba_id}/insumos", response_model=List[schemas.InsumoPrueba])
def read_insumos_por_prueba(prueba_id: int, db: Session = Depends(get_db)):
    return db.query(models.InsumoPrueba).filter(
        models.InsumoPrueba.prueba_id == prueba_id
    ).all()


@router.delete("/insumos-prueba/{rel_id}")
def delete_insumo_prueba(rel_id: int, db: Session = Depends(get_db)):
    db_rel = db.query(models.InsumoPrueba).filter(models.InsumoPrueba.id == rel_id).first()
    if not db_rel:
        raise HTTPException(status_code=404, detail="Relación no encontrada")
    db.delete(db_rel)
    db.commit()
    return {"mensaje": "Relación eliminada"}


# ═══════════════════════════════════════════════════════════════
# MOVIMIENTOS DE INVENTARIO
# ═══════════════════════════════════════════════════════════════

@router.post("/movimientos", response_model=schemas.MovimientoInventario, status_code=201)
def create_movimiento(movimiento: schemas.MovimientoInventarioCreate, db: Session = Depends(get_db)):
    db_insumo = db.query(models.Insumo).filter(models.Insumo.id == movimiento.insumo_id).first()
    if not db_insumo:
        raise HTTPException(status_code=404, detail="Insumo no encontrado")
    
    # Actualizar stock
    if movimiento.tipo == "ENTRADA":
        db_insumo.stock_actual += movimiento.cantidad
    elif movimiento.tipo == "SALIDA":
        if db_insumo.stock_actual < movimiento.cantidad:
            raise HTTPException(status_code=400, detail="Stock insuficiente")
        db_insumo.stock_actual -= movimiento.cantidad
    
    db_mov = models.MovimientoInventario(**movimiento.model_dump())
    db.add(db_mov)
    db.commit()
    db.refresh(db_mov)
    return db_mov


@router.get("/movimientos", response_model=List[schemas.MovimientoInventario])
def read_movimientos(
    insumo_id: Optional[int] = None,
    limite: int = 50,
    db: Session = Depends(get_db)
):
    query = db.query(models.MovimientoInventario)
    if insumo_id:
        query = query.filter(models.MovimientoInventario.insumo_id == insumo_id)
    return query.order_by(models.MovimientoInventario.fecha.desc()).limit(limite).all()


@router.get("/insumos/bajo-stock", response_model=List[schemas.Insumo])
def read_insumos_bajo_stock(db: Session = Depends(get_db)):
    """Retorna insumos cuyo stock está por debajo del mínimo"""
    return db.query(models.Insumo).filter(
        models.Insumo.stock_actual <= models.Insumo.stock_minimo,
        models.Insumo.activo == True
    ).all()


# ═══════════════════════════════════════════════════════════════
# CÁLCULO DE COSTOS POR ORDEN
# ═══════════════════════════════════════════════════════════════

@router.get("/costos-orden/{orden_id}", response_model=schemas.ResumenCostosOrden)
def calcular_costos_orden(orden_id: int, db: Session = Depends(get_db)):
    """
    Calcula el costo total de insumos consumidos en una orden
    """
    db_orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    # Obtener todas las pruebas de esta orden (a través de los resultados)
    resultados = db.query(models.ResultadoParametro).filter(
        models.ResultadoParametro.orden_id == orden_id
    ).all()
    
    # Obtener los IDs de parámetros únicos
    param_ids = list(set(r.parametro_id for r in resultados))
    
    # Obtener las pruebas relacionadas a estos parámetros
    pruebas_ids = set()
    for param_id in param_ids:
        param = db.query(models.Parametro).filter(models.Parametro.id == param_id).first()
        if param:
            pruebas_ids.add(param.prueba_id)
    
    # Para cada prueba, obtener los insumos que consume
    detalle_costos = []
    costo_total = 0.0
    
    for prueba_id in pruebas_ids:
        insumos_prueba = db.query(models.InsumoPrueba).filter(
            models.InsumoPrueba.prueba_id == prueba_id
        ).all()
        
        for ip in insumos_prueba:
            insumo = db.query(models.Insumo).filter(models.Insumo.id == ip.insumo_id).first()
            if insumo:
                costo = ip.cantidad * insumo.precio_unitario
                costo_total += costo
                detalle_costos.append({
                    "insumo_id": insumo.id,
                    "insumo_nombre": insumo.nombre,
                    "cantidad_usada": ip.cantidad,
                    "costo_total": costo
                })
    
    return {
        "orden_id": orden_id,
        "fecha": db_orden.fecha,
        "costo_total_usd": costo_total,
        "detalle": detalle_costos
    }


@router.get("/costos-hoy")
def costos_del_dia(db: Session = Depends(get_db)):
    """Retorna el costo total de insumos consumidos hoy"""
    hoy = date.today()
    
    movimientos = db.query(models.MovimientoInventario).filter(
        models.MovimientoInventario.fecha == hoy,
        models.MovimientoInventario.tipo == "SALIDA"
    ).all()
    
    costo_total = 0.0
    for mov in movimientos:
        insumo = db.query(models.Insumo).filter(models.Insumo.id == mov.insumo_id).first()
        if insumo:
            costo_total += mov.cantidad * insumo.precio_unitario
    
    return {"fecha": hoy, "costo_total_usd": costo_total}
