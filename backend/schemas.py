from pydantic import BaseModel
from datetime import date
from typing import Optional, List
from models import SexoEnum, EstadoPagoEnum, TipoPruebaEnum  # ← agrega TipoPruebaEnum

# --- PACIENTES ---
class PacienteBase(BaseModel):
    cedula           : str
    nombre           : str
    apellido         : str
    fecha_nacimiento : date
    sexo             : SexoEnum
    telefono         : Optional[str] = None

class PacienteCreate(PacienteBase):
    pass

class PacienteUpdate(BaseModel):
    cedula           : Optional[str]  = None
    nombre           : Optional[str]  = None
    apellido         : Optional[str]  = None
    fecha_nacimiento : Optional[date] = None
    sexo             : Optional[SexoEnum] = None
    telefono         : Optional[str]  = None

class Paciente(PacienteBase):
    id: int
    class Config:
        from_attributes = True

# --- PRUEBAS ---
class PruebaBase(BaseModel):
    nombre       : str
    descripcion  : Optional[str] = None
    precio_usd   : float = 0.0
    tipo         : TipoPruebaEnum = TipoPruebaEnum.tabla
    orden_visual : int = 0

class PruebaCreate(PruebaBase):
    pass

class Prueba(PruebaBase):
    id: int
    class Config:
        from_attributes = True

# --- PARÁMETROS ---
class ParametroBase(BaseModel):
    prueba_id    : int
    nombre       : str
    unidad       : Optional[str] = None
    categoria    : Optional[str] = None
    orden_visual : int = 0

class ParametroCreate(ParametroBase):
    pass

class Parametro(ParametroBase):
    id: int
    class Config:
        from_attributes = True

# --- RANGOS REFERENCIA ---
class RangoReferenciaBase(BaseModel):
    parametro_id     : int
    sexo             : SexoEnum = SexoEnum.A
    edad_min_dias    : int = 0
    edad_max_dias    : int = 36500
    texto_referencia : str
    valor_min_num    : Optional[float] = None
    valor_max_num    : Optional[float] = None

class RangoReferenciaCreate(RangoReferenciaBase):
    pass

class RangoReferencia(RangoReferenciaBase):
    id: int
    class Config:
        from_attributes = True

# --- ÓRDENES DE EXAMEN ---
class OrdenExamenBase(BaseModel):
    paciente_id : int
    fecha       : date
    estado_pago : EstadoPagoEnum = EstadoPagoEnum("Pendiente")
    monto_usd   : Optional[float] = None
    monto_bs    : Optional[float] = None
    notas_tecnicas : Optional[str] = None

class OrdenExamenCreate(OrdenExamenBase):
    pass

class OrdenExamenUpdate(BaseModel):
    fecha       : Optional[date] = None
    estado_pago : Optional[EstadoPagoEnum] = None
    monto_usd   : Optional[float] = None
    monto_bs    : Optional[float] = None

class OrdenExamen(OrdenExamenBase):
    id         : int
    resultados : List["ResultadoParametro"] = []
    class Config:
        from_attributes = True

class OrdenListItem(BaseModel):
    id             : int
    paciente_id    : int
    fecha          : date
    estado_pago    : EstadoPagoEnum
    monto_usd      : Optional[float] = None
    monto_bs       : Optional[float] = None
    num_resultados : int = 0
    class Config:
        from_attributes = True

# --- RESULTADOS DE PARÁMETRO ---
class ResultadoParametroBase(BaseModel):
    orden_id        : int
    parametro_id    : int
    valor           : str
    marcado_anormal : bool = False

class ResultadoParametroCreate(ResultadoParametroBase):
    pass

class ResultadoParametroUpdate(BaseModel):
    valor           : Optional[str]  = None
    marcado_anormal : Optional[bool] = None

class ResultadoParametro(ResultadoParametroBase):
    id: int
    class Config:
        from_attributes = True

class ResultadoLoteUpdate(BaseModel):
    id: int
    valor: str = ""
    marcado_anormal: bool = False
    rango_referencia_manual: Optional[str] = None

OrdenExamen.model_rebuild()

# --- TASA BCV ---
class TasaBCVBase(BaseModel):
    tasa  : float
    fecha : date
    slot  : Optional[str] = None  # "09:00", "13:00" o "manual"

class TasaBCVCreate(TasaBCVBase):
    pass

class TasaBCV(TasaBCVBase):
    id: int
    class Config:
        from_attributes = True

# --- ORDEN PARA FACTURACIÓN (incluye datos del paciente) ---
class OrdenFacturacion(BaseModel):
    id          : int
    paciente_id : int
    paciente_nombre  : str
    paciente_cedula  : str
    fecha       : date
    estado_pago : EstadoPagoEnum
    monto_usd   : Optional[float] = None
    monto_bs    : Optional[float] = None
    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════
# INVENTARIO - Reactivos y Suplementos
# ═══════════════════════════════════════════════════════════════

# --- CATEGORÍAS DE INSUMOS ---
class CategoriaInsumoBase(BaseModel):
    nombre      : str
    descripcion : Optional[str] = None

class CategoriaInsumoCreate(CategoriaInsumoBase):
    pass

class CategoriaInsumo(CategoriaInsumoBase):
    id: int
    class Config:
        from_attributes = True


# --- INSUMOS ---
class InsumoBase(BaseModel):
    categoria_id    : int
    nombre          : str
    descripcion     : Optional[str] = None
    unidad_medida   : str
    precio_unitario : float = 0.0
    stock_actual    : float = 0.0
    stock_minimo     : float = 0.0
    activo          : bool = True

class InsumoCreate(InsumoBase):
    pass

class InsumoUpdate(BaseModel):
    nombre          : Optional[str] = None
    descripcion     : Optional[str] = None
    unidad_medida   : Optional[str] = None
    precio_unitario : Optional[float] = None
    stock_actual    : Optional[float] = None
    stock_minimo     : Optional[float] = None
    activo          : Optional[bool] = None

class Insumo(InsumoBase):
    id: int
    class Config:
        from_attributes = True


# --- INSUMOS POR PRUEBA ---
class InsumoPruebaBase(BaseModel):
    prueba_id : int
    insumo_id : int
    cantidad  : float

class InsumoPruebaCreate(InsumoPruebaBase):
    pass

class InsumoPrueba(InsumoPruebaBase):
    id: int
    class Config:
        from_attributes = True


# --- MOVIMIENTOS DE INVENTARIO ---
class MovimientoInventarioBase(BaseModel):
    insumo_id : int
    tipo      : str  # "ENTRADA" o "SALIDA"
    cantidad  : float
    fecha     : date
    orden_id  : Optional[int] = None
    notas     : Optional[str] = None

class MovimientoInventarioCreate(MovimientoInventarioBase):
    pass

class MovimientoInventario(MovimientoInventarioBase):
    id: int
    class Config:
        from_attributes = True


# --- REPORTE DE COSTOS POR ORDEN ---
class CostoInsumoOrden(BaseModel):
    insumo_id     : int
    insumo_nombre : str
    cantidad_usada: float
    costo_total   : float

class ResumenCostosOrden(BaseModel):
    orden_id       : int
    fecha          : date
    costo_total_usd: float
    detalle        : List[CostoInsumoOrden]