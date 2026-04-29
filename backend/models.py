from sqlalchemy import Column, Integer, String, Date, Float, Boolean, ForeignKey, Enum
from sqlalchemy.orm import relationship
import enum
from database import Base

class SexoEnum(str, enum.Enum):
    M = "M"
    F = "F"
    A = "A"

class EstadoPagoEnum(str, enum.Enum):
    PENDIENTE = "Pendiente"
    PAGADO    = "Pagado"

# ── NUEVO ──────────────────────────────────────────
class TipoPruebaEnum(str, enum.Enum):
    tabla         = "tabla"
    cualitativa   = "cualitativa"
    orina         = "orina"
    coproanalisis = "coproanalisis"
    cultivo       = "cultivo"
# ───────────────────────────────────────────────────

class Configuracion(Base):
    __tablename__ = "configuracion"
    id                  = Column(Integer, primary_key=True, index=True)
    nombre_laboratorio  = Column(String, default="Laboratorio Clínico Mónica")
    nombre_licenciada   = Column(String, default="Lcda Marisol Pérez Pérez")
    telefono            = Column(String, default="0414-4160185")
    rif                 = Column(String, default="J-297772987")
    logo_path           = Column(String, nullable=True)

class Paciente(Base):
    __tablename__ = "pacientes"
    id               = Column(Integer, primary_key=True, index=True)
    cedula           = Column(String, unique=True, index=True)
    nombre           = Column(String)
    apellido         = Column(String)
    fecha_nacimiento = Column(Date)
    sexo             = Column(Enum(SexoEnum))
    telefono         = Column(String, nullable=True)

    ordenes = relationship("OrdenExamen", back_populates="paciente")

class Prueba(Base):
    __tablename__ = "pruebas"
    id           = Column(Integer, primary_key=True, index=True)
    nombre       = Column(String, unique=True, index=True)
    descripcion  = Column(String, nullable=True)  # Nuevo
    precio_usd   = Column(Float, default=0.0)    # Nuevo
    tipo         = Column(Enum(TipoPruebaEnum), default=TipoPruebaEnum.tabla)
    orden_visual = Column(Integer, default=0)

    parametros = relationship("Parametro", back_populates="prueba")

class Parametro(Base):
    __tablename__ = "parametros"
    id           = Column(Integer, primary_key=True, index=True)
    prueba_id    = Column(Integer, ForeignKey("pruebas.id"))
    nombre       = Column(String, index=True)
    unidad       = Column(String, nullable=True)
    categoria    = Column(String, nullable=True)  # Ej: "Fórmula Leucocitaria"
    orden_visual = Column(Integer, default=0)

    prueba             = relationship("Prueba", back_populates="parametros")
    rangos_referencia  = relationship("RangoReferencia", back_populates="parametro")

class RangoReferencia(Base):
    __tablename__ = "rangos_referencia"
    id               = Column(Integer, primary_key=True, index=True)
    parametro_id     = Column(Integer, ForeignKey("parametros.id"))
    sexo             = Column(Enum(SexoEnum), default=SexoEnum.A)
    edad_min_dias    = Column(Integer, default=0)
    edad_max_dias    = Column(Integer, default=36500)
    texto_referencia = Column(String)
    valor_min_num    = Column(Float, nullable=True)
    valor_max_num    = Column(Float, nullable=True)

    parametro = relationship("Parametro", back_populates="rangos_referencia")

class OrdenExamen(Base):
    __tablename__ = "ordenes_examen"
    id           = Column(Integer, primary_key=True, index=True)
    paciente_id  = Column(Integer, ForeignKey("pacientes.id"))
    fecha        = Column(Date)
    estado_pago  = Column(Enum(EstadoPagoEnum, values_callable=lambda x: [e.value for e in x]), default=EstadoPagoEnum("Pendiente"))
    monto_usd    = Column(Float, nullable=True)
    monto_bs     = Column(Float, nullable=True)
    notas_tecnicas = Column(String, nullable=True)

    paciente   = relationship("Paciente", back_populates="ordenes")
    resultados = relationship("ResultadoParametro", back_populates="orden")

class ResultadoParametro(Base):
    __tablename__ = "resultados_parametro"
    id               = Column(Integer, primary_key=True, index=True)
    orden_id         = Column(Integer, ForeignKey("ordenes_examen.id"))
    parametro_id     = Column(Integer, ForeignKey("parametros.id"))
    valor            = Column(String)
    marcado_anormal  = Column(Boolean, default=False)

    orden     = relationship("OrdenExamen", back_populates="resultados")
    parametro = relationship("Parametro")

class TasaBCV(Base):
    __tablename__ = "tasas_bcv"
    id     = Column(Integer, primary_key=True, index=True)
    tasa   = Column(Float, nullable=False)
    fecha  = Column(Date, nullable=False)
    slot   = Column(String, nullable=True)  # "09:00" o "13:00" o "manual"


# ═══════════════════════════════════════════════════════════════
# INVENTARIO - Reactivos y Suplementos
# ═══════════════════════════════════════════════════════════════

class CategoriaInsumo(Base):
    __tablename__ = "categorias_insumo"
    id           = Column(Integer, primary_key=True, index=True)
    nombre       = Column(String, nullable=False)
    descripcion  = Column(String, nullable=True)

    insumos = relationship("Insumo", back_populates="categoria")


class Insumo(Base):
    __tablename__ = "insumos"
    id              = Column(Integer, primary_key=True, index=True)
    categoria_id    = Column(Integer, ForeignKey("categorias_insumo.id"))
    nombre          = Column(String, nullable=False)
    descripcion     = Column(String, nullable=True)
    unidad_medida   = Column(String, nullable=False)  # mL, L, g, kg, unidades, etc.
    precio_unitario = Column(Float, default=0.0)     # Precio por unidad de medida en USD
    stock_actual    = Column(Float, default=0.0)     # Stock actual
    stock_minimo     = Column(Float, default=0.0)    # Alerta cuando llegue a este nivel
    activo          = Column(Boolean, default=True)

    categoria     = relationship("CategoriaInsumo", back_populates="insumos")
    movimientos   = relationship("MovimientoInventario", back_populates="insumo")
    pruebas_rel   = relationship("InsumoPrueba", back_populates="insumo")


class InsumoPrueba(Base):
    """Define cuánto insumo se consume por cada prueba realizada"""
    __tablename__ = "insumos_pruebas"
    id           = Column(Integer, primary_key=True, index=True)
    prueba_id    = Column(Integer, ForeignKey("pruebas.id"))
    insumo_id    = Column(Integer, ForeignKey("insumos.id"))
    cantidad     = Column(Float, nullable=False)  # Cantidad consumida por prueba

    prueba = relationship("Prueba", back_populates="insumos_rel")
    insumo = relationship("Insumo", back_populates="pruebas_rel")


class MovimientoInventario(Base):
    """Movimientos de inventario (entradas y salidas)"""
    __tablename__ = "movimientos_inventario"
    id           = Column(Integer, primary_key=True, index=True)
    insumo_id    = Column(Integer, ForeignKey("insumos.id"))
    tipo         = Column(String, nullable=False)  # "ENTRADA" o "SALIDA"
    cantidad     = Column(Float, nullable=False)
    fecha        = Column(Date, nullable=False)
    orden_id     = Column(Integer, ForeignKey("ordenes_examen.id"), nullable=True)  # nullable para entradas manuales
    notas        = Column(String, nullable=True)

    insumo = relationship("Insumo", back_populates="movimientos")
    orden  = relationship("OrdenExamen")


# Agregar relación inversa en Prueba
Prueba.insumos_rel = relationship("InsumoPrueba", back_populates="prueba")