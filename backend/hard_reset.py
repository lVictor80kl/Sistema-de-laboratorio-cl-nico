from database import SessionLocal, engine, Base
import models
from sqlalchemy import text

def reset_and_seed():
    # 1. Drop tables in order
    tables_to_drop = [
        "resultados_parametro",
        "rangos_referencia",
        "parametros",
        "pruebas"
    ]
    
    with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
        print("--- DROPPING TABLES ---")
        for table in tables_to_drop:
            try:
                conn.execute(text(f"DROP TABLE IF EXISTS {table} CASCADE;"))
                print(f"Dropped {table}")
            except Exception as e:
                print(f"Error dropping {table}: {e}")

    # 2. Recreate tables
    print("\n--- RECREATING TABLES ---")
    Base.metadata.create_all(bind=engine)
    print("Tables recreated.")

    # 3. Seed data
    db = SessionLocal()
    try:
        print("\n--- SEEDING DATA ---")
        pruebas_data = [
            ("Perfil Lipídico", "Colesterol Total, HDL, LDL y Triglicéridos.", 38.50, models.TipoPruebaEnum.tabla, 1),
            ("Hematología Completa", "Conteo sanguíneo completo, VSG y frotis periférico.", 45.00, models.TipoPruebaEnum.tabla, 2),
            ("Perfil Tiroideo (T3, T4, TSH)", "Tamizaje integral para hiper e hipotiroidismo.", 62.00, models.TipoPruebaEnum.tabla, 3),
            ("Perfil Hepático", "Niveles de ALT, AST, ALP, Albúmina y Bilirrubina.", 55.00, models.TipoPruebaEnum.tabla, 4),
            ("Perfil Renal", "Urea, Creatinina, Ácido Úrico y Electrolitos.", 42.00, models.TipoPruebaEnum.tabla, 5),
            ("Examen de Orina (Uroanálisis)", "Evaluación física, química y microscópica de la orina.", 15.00, models.TipoPruebaEnum.orina, 6),
            ("Coproanálisis", "Examen parasitológico y macroscópico de heces.", 18.00, models.TipoPruebaEnum.coproanalisis, 7),
        ]

        for nombre, desc, precio, tipo, orden in pruebas_data:
            p = models.Prueba(nombre=nombre, descripcion=desc, precio_usd=precio, tipo=tipo, orden_visual=orden)
            db.add(p)
        db.commit()

        # Helper to add params
        def add_params(prueba_nombre, params_list):
            prueba = db.query(models.Prueba).filter(models.Prueba.nombre == prueba_nombre).first()
            if not prueba: return
            for nombre, unidad, cat, orden in params_list:
                nuevo_param = models.Parametro(prueba_id=prueba.id, nombre=nombre, unidad=unidad, categoria=cat, orden_visual=orden)
                db.add(nuevo_param)
        
        add_params("Perfil Lipídico", [
            ("Colesterol Total", "mg/dL", "Marcador Metabólico", 1),
            ("Triglicéridos", "mg/dL", "Ensayo Estándar", 2),
            ("HDL Colesterol", "mg/dL", "Lipoproteína de Alta Densidad", 3),
            ("LDL Colesterol", "mg/dL", "Lipoproteína de Baja Densidad", 4),
            ("VLDL Colesterol", "mg/dL", "Valor Calculado", 5),
        ])

        add_params("Hematología Completa", [
            ("Hemoglobina", "g/dL", "Serie Roja", 1),
            ("Hematocrito", "%", "Serie Roja", 2),
            ("Leucocitos", "x10³/µL", "Serie Blanca", 3),
            ("Plaquetas", "x10³/µL", "Serie Blanca", 4),
        ])

        add_params("Perfil Tiroideo (T3, T4, TSH)", [
            ("T3 Libre", "pg/mL", "Hormonas Tiroideas", 1),
            ("T4 Libre", "ng/dL", "Hormonas Tiroideas", 2),
            ("TSH Ultrasensible", "uIU/mL", "Hormonas Tiroideas", 3),
        ])

        add_params("Examen de Orina (Uroanálisis)", [
            ("Color", None, "Examen Físico", 1),
            ("Aspecto", None, "Examen Físico", 2),
            ("Densidad", None, "Examen Físico", 3),
            ("pH", None, "Examen Químico", 4),
        ])

        db.commit()
        print("Seeding finished successfully.")
    except Exception as e:
        print("Seeding Error:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    reset_and_seed()
