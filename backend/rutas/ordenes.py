from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from typing import List, Optional
import generar_pdf

import models
from models import ResultadoParametro
import schemas
from database import get_db

router = APIRouter(
    prefix="/api/ordenes",
    tags=["Órdenes y Resultados"]
)


# ─────────────────────────────────────────
# ÓRDENES DE EXAMEN
# ─────────────────────────────────────────

@router.post("/", response_model=schemas.OrdenExamen, status_code=201)
def create_orden(orden: schemas.OrdenExamenCreate, db: Session = Depends(get_db)):
    db_paciente = db.query(models.Paciente).filter(models.Paciente.id == orden.paciente_id).first()
    if not db_paciente:
        raise HTTPException(status_code=404, detail="Paciente no encontrado")

    nueva_orden = models.OrdenExamen(**orden.model_dump())
    db.add(nueva_orden)
    db.commit()
    db.refresh(nueva_orden)
    return nueva_orden


@router.get("/", response_model=List[schemas.OrdenListItem])
def read_ordenes(
    skip: int = 0,
    limit: int = 100,
    paciente_id: Optional[int] = None,
    estado_pago: Optional[models.EstadoPagoEnum] = None,
    db: Session = Depends(get_db)
):
    query = db.query(models.OrdenExamen)

    if paciente_id:
        query = query.filter(models.OrdenExamen.paciente_id == paciente_id)
    if estado_pago:
        query = query.filter(models.OrdenExamen.estado_pago == estado_pago)

    ordenes = query.order_by(models.OrdenExamen.fecha.desc()).offset(skip).limit(limit).all()
    
    # Agregar conteo de resultados
    resultado = []
    for orden in ordenes:
        num_resultados = db.query(models.ResultadoParametro).filter(
            models.ResultadoParametro.orden_id == orden.id
        ).count()
        
        resultado.append({
            "id": orden.id,
            "paciente_id": orden.paciente_id,
            "fecha": orden.fecha,
            "estado_pago": orden.estado_pago,
            "monto_usd": orden.monto_usd,
            "monto_bs": orden.monto_bs,
            "num_resultados": num_resultados
        })
    
    return resultado


@router.get("/{orden_id}", response_model=schemas.OrdenExamen)
def read_orden(orden_id: int, db: Session = Depends(get_db)):
    db_orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return db_orden


@router.patch("/{orden_id}", response_model=schemas.OrdenExamen)
def update_orden(orden_id: int, orden: schemas.OrdenExamenUpdate, db: Session = Depends(get_db)):
    db_orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    datos_actualizados = orden.model_dump(exclude_unset=True)
    for key, value in datos_actualizados.items():
        setattr(db_orden, key, value)

    db.commit()
    db.refresh(db_orden)
    return db_orden


@router.delete("/{orden_id}")
def delete_orden(orden_id: int, db: Session = Depends(get_db)):
    db_orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    db.delete(db_orden)
    db.commit()
    return {"mensaje": "Orden eliminada correctamente"}


# ─────────────────────────────────────────
# RESULTADOS DE PARÁMETRO
# ─────────────────────────────────────────

@router.post("/{orden_id}/resultados", response_model=schemas.ResultadoParametro, status_code=201)
def create_resultado(orden_id: int, resultado: schemas.ResultadoParametroCreate, db: Session = Depends(get_db)):
    db_orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    if resultado.orden_id != orden_id:
        raise HTTPException(status_code=400, detail="ID de orden no coincide")

    db_parametro = db.query(models.Parametro).filter(models.Parametro.id == resultado.parametro_id).first()
    if not db_parametro:
        raise HTTPException(status_code=404, detail="Parámetro no encontrado")

    # Evitar duplicado del mismo parámetro en la misma orden
    duplicado = db.query(models.ResultadoParametro).filter(
        models.ResultadoParametro.orden_id == orden_id,
        models.ResultadoParametro.parametro_id == resultado.parametro_id
    ).first()
    if duplicado:
        raise HTTPException(status_code=400, detail="Este parámetro ya tiene resultado en esta orden")

    nuevo_resultado = models.ResultadoParametro(**resultado.model_dump())
    db.add(nuevo_resultado)
    db.commit()
    db.refresh(nuevo_resultado)
    return nuevo_resultado


@router.post("/{orden_id}/resultados/lote", response_model=List[schemas.ResultadoParametro], status_code=201)
def create_resultados_lote(orden_id: int, resultados: List[schemas.ResultadoParametroCreate], db: Session = Depends(get_db)):
    """Guardar múltiples resultados de una orden en una sola petición"""
    db_orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    nuevos = []
    for resultado in resultados:
        if resultado.orden_id != orden_id:
            raise HTTPException(status_code=400, detail=f"ID de orden no coincide en parámetro {resultado.parametro_id}")

        duplicado = db.query(models.ResultadoParametro).filter(
            models.ResultadoParametro.orden_id == orden_id,
            models.ResultadoParametro.parametro_id == resultado.parametro_id
        ).first()
        if duplicado:
            raise HTTPException(status_code=400, detail=f"El parámetro {resultado.parametro_id} ya tiene resultado en esta orden")

        nuevo = models.ResultadoParametro(**resultado.model_dump())
        db.add(nuevo)
        nuevos.append(nuevo)

    db.commit()
    for r in nuevos:
        db.refresh(r)
    return nuevos


@router.get("/{orden_id}/resultados", response_model=List[schemas.ResultadoParametro])
def read_resultados(orden_id: int, db: Session = Depends(get_db)):
    db_orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    return db.query(models.ResultadoParametro).filter(
        models.ResultadoParametro.orden_id == orden_id
    ).all()


@router.get("/{orden_id}/form-resultados")
def get_form_resultados(orden_id: int, db: Session = Depends(get_db)):
    """
    Endpoint BFF (Backend For Frontend)
    Retorna la estructura pre-masticada agrupada por prueba,
    con el rango de referencia exacto ya calculado según la edad y sexo del paciente.
    """
    db_orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    db_paciente = db.query(models.Paciente).filter(models.Paciente.id == db_orden.paciente_id).first()
    db_resultados = db.query(models.ResultadoParametro).filter(models.ResultadoParametro.orden_id == orden_id).all()
    
    # Calcular edad en días para filtrar rangos
    from datetime import date
    if db_paciente.fecha_nacimiento:
        edad_dias = (db_orden.fecha - db_paciente.fecha_nacimiento).days
        edad_anios = edad_dias // 365
    else:
        edad_dias = 0
        edad_anios = 0

    pruebas_dict = {}

    for res in db_resultados:
        param = db.query(models.Parametro).filter(models.Parametro.id == res.parametro_id).first()
        prueba = db.query(models.Prueba).filter(models.Prueba.id == param.prueba_id).first()
        
        # Lógica de Rango de Referencia
        rango = db.query(models.RangoReferencia).filter(
            models.RangoReferencia.parametro_id == param.id
        ).filter(
            (models.RangoReferencia.sexo == db_paciente.sexo) | (models.RangoReferencia.sexo == models.SexoEnum.A)
        ).filter(
            models.RangoReferencia.edad_min_dias <= edad_dias,
            models.RangoReferencia.edad_max_dias >= edad_dias
        ).first()

        # Fallback genérico si no hay exacto
        if not rango:
            rango = db.query(models.RangoReferencia).filter(
                models.RangoReferencia.parametro_id == param.id,
                models.RangoReferencia.sexo == models.SexoEnum.A
            ).first()

        # Priorizar el rango_referencia_manual sobre el calculado
        texto_referencia = res.rango_referencia_manual if getattr(res, 'rango_referencia_manual', None) is not None else (rango.texto_referencia if rango else "-")

        if prueba.id not in pruebas_dict:
            pruebas_dict[prueba.id] = {
                "prueba_id": prueba.id,
                "prueba_nombre": prueba.nombre,
                "parametros": []
            }
        
        pruebas_dict[prueba.id]["parametros"].append({
            "resultado_id": res.id,
            "parametro_id": param.id,
            "nombre": param.nombre,
            "unidad": param.unidad or "",
            "texto_referencia": texto_referencia,
            "valor": res.valor or "",
            "marcado_anormal": res.marcado_anormal
        })

    return {
        "orden_id": orden_id,
        "paciente_nombre": f"{db_paciente.nombre} {db_paciente.apellido}",
        "edad_anios": edad_anios,
        "sexo": db_paciente.sexo.value,
        "pruebas": list(pruebas_dict.values())
    }


@router.put("/{orden_id}/resultados/lote")
def update_resultados_lote(orden_id: int, payload: List[schemas.ResultadoLoteUpdate], db: Session = Depends(get_db)):
    """Actualiza múltiples resultados de una vez"""
    db_orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    for item in payload:
        db_res = db.query(models.ResultadoParametro).filter(
            models.ResultadoParametro.id == item.id,
            models.ResultadoParametro.orden_id == orden_id
        ).first()
        if db_res:
            db_res.valor = item.valor
            db_res.marcado_anormal = item.marcado_anormal
            if getattr(item, 'rango_referencia_manual', None) is not None:
                db_res.rango_referencia_manual = item.rango_referencia_manual

    db.commit()
    return {"mensaje": "Resultados guardados exitosamente"}


@router.patch("/resultados/{resultado_id}", response_model=schemas.ResultadoParametro)
def update_resultado(resultado_id: int, resultado: schemas.ResultadoParametroUpdate, db: Session = Depends(get_db)):
    db_resultado = db.query(models.ResultadoParametro).filter(models.ResultadoParametro.id == resultado_id).first()
    if not db_resultado:
        raise HTTPException(status_code=404, detail="Resultado no encontrado")

    datos_actualizados = resultado.model_dump(exclude_unset=True)
    for key, value in datos_actualizados.items():
        setattr(db_resultado, key, value)

    db.commit()
    db.refresh(db_resultado)
    return db_resultado


@router.delete("/resultados/{resultado_id}")
def delete_resultado(resultado_id: int, db: Session = Depends(get_db)):
    db_resultado = db.query(models.ResultadoParametro).filter(models.ResultadoParametro.id == resultado_id).first()
    if not db_resultado:
        raise HTTPException(status_code=404, detail="Resultado no encontrado")
    db.delete(db_resultado)
    db.commit()
    return {"mensaje": "Resultado eliminado correctamente"}


# ─────────────────────────────────────────
# GENERACIÓN DE REPORTE PDF
# ─────────────────────────────────────────

def calcular_edad_dias(fecha_nacimiento, fecha_examen=None):
    """Calcula la edad en días"""
    from datetime import date
    if not fecha_nacimiento:
        return 0
    hoy = fecha_examen if fecha_examen else date.today()
    return (hoy - fecha_nacimiento).days


@router.get("/{orden_id}/reporte")
def get_reporte_pdf(orden_id: int, db: Session = Depends(get_db)):
    """Genera y descarga el reporte PDF premium de la orden"""
    db_orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    db_paciente = db.query(models.Paciente).filter(models.Paciente.id == db_orden.paciente_id).first()
    
    # Obtener todos los resultados de la orden
    db_resultados = db.query(models.ResultadoParametro).filter(
        models.ResultadoParametro.orden_id == orden_id
    ).all()

    if not db_resultados:
        raise HTTPException(status_code=400, detail="La orden no tiene resultados cargados")

    # Calcular edad del paciente en días
    edad_dias = calcular_edad_dias(db_paciente.fecha_nacimiento, db_orden.fecha)

    # Agrupar resultados por prueba
    pruebas_dict = {}
    for res in db_resultados:
        param = db.query(models.Parametro).filter(models.Parametro.id == res.parametro_id).first()
        prueba = db.query(models.Prueba).filter(models.Prueba.id == param.prueba_id).first()
        
        # Buscar rango de referencia SEGÚN sexo y edad del paciente
        rango = db.query(models.RangoReferencia).filter(
            models.RangoReferencia.parametro_id == param.id
        ).filter(
            # Filtrar por sexo: el rango debe ser del sexo del paciente o 'A' (ambos)
            (models.RangoReferencia.sexo == db_paciente.sexo) | (models.RangoReferencia.sexo == models.SexoEnum.A)
        ).filter(
            # Filtrar por edad: la edad del paciente debe estar dentro del rango
            models.RangoReferencia.edad_min_dias <= edad_dias,
            models.RangoReferencia.edad_max_dias >= edad_dias
        ).first()

        # Si no encontró rango exacto, buscar uno genérico (sin filtro de edad específico)
        if not rango:
            rango = db.query(models.RangoReferencia).filter(
                models.RangoReferencia.parametro_id == param.id,
                models.RangoReferencia.sexo == models.SexoEnum.A
            ).first()

        class RangoManualAplicado:
            def __init__(self, texto):
                self.texto_referencia = texto

        rango_final = RangoManualAplicado(res.rango_referencia_manual) if getattr(res, 'rango_referencia_manual', None) else rango

        if prueba.id not in pruebas_dict:
            pruebas_dict[prueba.id] = {
                "prueba": prueba,
                "parametros": []
            }
        
        pruebas_dict[prueba.id]["parametros"].append({
            "parametro": param,
            "resultado": res,
            "rango": rango_final
        })

    # Datos de configuración
    config = {
        "nombre_laboratorio": "LabMónica",
        "nombre_licenciada": "Monica Arrieta",
        "telefono": "+1 (809) 555-1212",
        "rif": "J-12345678-9"
    }

    pdf_buffer = generar_pdf.generar_pdf_orden(
        db_orden, 
        db_paciente, 
        list(pruebas_dict.values()), 
        config
    )

    filename = f"Reporte_{db_paciente.apellido}_{orden_id}.pdf"
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.get("/{orden_id}/reporte/preview")
def get_reporte_pdf_preview(orden_id: int, db: Session = Depends(get_db)):
    """Genera el reporte PDF y lo devuelve en base64 para vista previa"""
    db_orden = db.query(models.OrdenExamen).filter(models.OrdenExamen.id == orden_id).first()
    if not db_orden:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    db_paciente = db.query(models.Paciente).filter(models.Paciente.id == db_orden.paciente_id).first()
    
    db_resultados = db.query(models.ResultadoParametro).filter(
        models.ResultadoParametro.orden_id == orden_id
    ).all()

    if not db_resultados:
        raise HTTPException(status_code=400, detail="La orden no tiene resultados cargados")

    edad_dias = calcular_edad_dias(db_paciente.fecha_nacimiento, db_orden.fecha)

    pruebas_dict = {}
    for res in db_resultados:
        param = db.query(models.Parametro).filter(models.Parametro.id == res.parametro_id).first()
        prueba = db.query(models.Prueba).filter(models.Prueba.id == param.prueba_id).first()
        
        rango = db.query(models.RangoReferencia).filter(
            models.RangoReferencia.parametro_id == param.id
        ).filter(
            (models.RangoReferencia.sexo == db_paciente.sexo) | (models.RangoReferencia.sexo == models.SexoEnum.A)
        ).filter(
            models.RangoReferencia.edad_min_dias <= edad_dias,
            models.RangoReferencia.edad_max_dias >= edad_dias
        ).first()

        if not rango:
            rango = db.query(models.RangoReferencia).filter(
                models.RangoReferencia.parametro_id == param.id,
                models.RangoReferencia.sexo == models.SexoEnum.A
            ).first()

        class RangoManualAplicado:
            def __init__(self, texto):
                self.texto_referencia = texto

        rango_final = RangoManualAplicado(res.rango_referencia_manual) if getattr(res, 'rango_referencia_manual', None) else rango

        if prueba.id not in pruebas_dict:
            pruebas_dict[prueba.id] = {
                "prueba": prueba,
                "parametros": []
            }
        
        pruebas_dict[prueba.id]["parametros"].append({
            "parametro": param,
            "resultado": res,
            "rango": rango_final
        })

    config = {
        "nombre_laboratorio": "LabMónica",
        "nombre_licenciada": "Monica Arrieta",
        "telefono": "+1 (809) 555-1212",
        "rif": "J-12345678-9"
    }

    pdf_buffer = generar_pdf.generar_pdf_orden(
        db_orden, 
        db_paciente, 
        list(pruebas_dict.values()), 
        config
    )

    # Convertir a base64
    import base64
    pdf_base64 = base64.b64encode(pdf_buffer.getvalue()).decode('utf-8')

    return {
        "orden_id": orden_id,
        "paciente": f"{db_paciente.nombre} {db_paciente.apellido}",
        "pdf_base64": pdf_base64,
        "filename": f"Reporte_{db_paciente.apellido}_{orden_id}.pdf"
    }