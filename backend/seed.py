import logging
from database import SessionLocal
from models import Prueba, Parametro, RangoReferencia, TipoPruebaEnum, SexoEnum

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

DATA_MAESTRA = [
    {
        "nombre": "Hematología Completa",
        "descripcion": "Estudio completo de sangre",
        "precio_usd": 10.0,
        "tipo": TipoPruebaEnum.tabla,
        "parametros": [
            {
                "nombre": "Hemoglobina",
                "unidad": "g/dL",
                "categoria": "Serie Roja",
                "orden_visual": 1,
                "rangos": [
                    {"sexo": SexoEnum.M, "edad_min_dias": 0, "edad_max_dias": 36500, "texto_referencia": "13.5 - 17.5", "valor_min_num": 13.5, "valor_max_num": 17.5},
                    {"sexo": SexoEnum.F, "edad_min_dias": 0, "edad_max_dias": 36500, "texto_referencia": "12.0 - 15.5", "valor_min_num": 12.0, "valor_max_num": 15.5}
                ]
            },
            {
                "nombre": "Hematocrito",
                "unidad": "%",
                "categoria": "Serie Roja",
                "orden_visual": 2,
                "rangos": [
                    {"sexo": SexoEnum.M, "edad_min_dias": 0, "edad_max_dias": 36500, "texto_referencia": "41 - 53", "valor_min_num": 41.0, "valor_max_num": 53.0},
                    {"sexo": SexoEnum.F, "edad_min_dias": 0, "edad_max_dias": 36500, "texto_referencia": "36 - 46", "valor_min_num": 36.0, "valor_max_num": 46.0}
                ]
            },
            {
                "nombre": "Leucocitos",
                "unidad": "x10^3/uL",
                "categoria": "Serie Blanca",
                "orden_visual": 3,
                "rangos": [
                    {"sexo": SexoEnum.A, "edad_min_dias": 0, "edad_max_dias": 36500, "texto_referencia": "4.5 - 11.0", "valor_min_num": 4.5, "valor_max_num": 11.0}
                ]
            },
            {
                "nombre": "Plaquetas",
                "unidad": "x10^3/uL",
                "categoria": "Serie Plaquetaria",
                "orden_visual": 4,
                "rangos": [
                    {"sexo": SexoEnum.A, "edad_min_dias": 0, "edad_max_dias": 36500, "texto_referencia": "150 - 450", "valor_min_num": 150.0, "valor_max_num": 450.0}
                ]
            }
        ]
    },
    {
        "nombre": "Glicemia Basal",
        "descripcion": "Medición de glucosa en sangre en ayunas",
        "precio_usd": 5.0,
        "tipo": TipoPruebaEnum.tabla,
        "parametros": [
            {
                "nombre": "Glucosa",
                "unidad": "mg/dL",
                "categoria": "Química",
                "orden_visual": 1,
                "rangos": [
                    {"sexo": SexoEnum.A, "edad_min_dias": 0, "edad_max_dias": 36500, "texto_referencia": "70 - 100", "valor_min_num": 70.0, "valor_max_num": 100.0}
                ]
            }
        ]
    },
    {
        "nombre": "Colesterol Total",
        "descripcion": "Nivel de colesterol total en la sangre",
        "precio_usd": 6.0,
        "tipo": TipoPruebaEnum.tabla,
        "parametros": [
            {
                "nombre": "Colesterol",
                "unidad": "mg/dL",
                "categoria": "Lípidos",
                "orden_visual": 1,
                "rangos": [
                    {"sexo": SexoEnum.A, "edad_min_dias": 0, "edad_max_dias": 36500, "texto_referencia": "Menor a 200", "valor_min_num": 0.0, "valor_max_num": 200.0}
                ]
            }
        ]
    }
]

def seed_db():
    db = SessionLocal()
    try:
        logger.info("Iniciando la siembra de la base de datos maestra de laboratorio...")
        pruebas_agregadas = 0

        for data_prueba in DATA_MAESTRA:
            # Comprobar si esta prueba en particular ya existe
            existe = db.query(Prueba).filter(Prueba.nombre == data_prueba["nombre"]).first()
            if existe:
                logger.info(f"Omitiendo '{data_prueba['nombre']}': Ya existe en la base de datos.")
                continue

            nueva_prueba = Prueba(
                nombre=data_prueba["nombre"],
                descripcion=data_prueba["descripcion"],
                precio_usd=data_prueba["precio_usd"],
                tipo=data_prueba["tipo"]
            )
            db.add(nueva_prueba)
            db.flush() # Guarda y nos da el ID para los parametros
            
            logger.info(f"Agregando Prueba: {nueva_prueba.nombre}")
            pruebas_agregadas += 1

            for data_param in data_prueba["parametros"]:
                nuevo_parametro = Parametro(
                    prueba_id=nueva_prueba.id,
                    nombre=data_param["nombre"],
                    unidad=data_param["unidad"],
                    categoria=data_param["categoria"],
                    orden_visual=data_param["orden_visual"]
                )
                db.add(nuevo_parametro)
                db.flush()

                for data_rango in data_param["rangos"]:
                    nuevo_rango = RangoReferencia(
                        parametro_id=nuevo_parametro.id,
                        sexo=data_rango["sexo"],
                        edad_min_dias=data_rango["edad_min_dias"],
                        edad_max_dias=data_rango["edad_max_dias"],
                        texto_referencia=data_rango["texto_referencia"],
                        valor_min_num=data_rango["valor_min_num"],
                        valor_max_num=data_rango["valor_max_num"]
                    )
                    db.add(nuevo_rango)

        # 4. Commit transaccional
        db.commit()
        if pruebas_agregadas > 0:
            logger.info(f"¡Siembra terminada! Se agregaron {pruebas_agregadas} pruebas nuevas con sus variables.")
        else:
            logger.info("No se agregaron pruebas nuevas (todas las del script ya existían).")

    except Exception as e:
        db.rollback()
        logger.error(f"Error al sembrar la base de datos: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
