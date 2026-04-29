from database import SessionLocal
import models

def seed_db():
    db = SessionLocal()
    try:
        pruebas = [
            ("Perfil Lipídico", "Colesterol Total, HDL, LDL y Triglicéridos.", 38.50, models.TipoPruebaEnum.TABLA, 1),
            ("Hematología Completa", "Conteo sanguíneo completo, VSG y frotis periférico.", 45.00, models.TipoPruebaEnum.TABLA, 2),
            ("Perfil Tiroideo (T3, T4, TSH)", "Tamizaje integral para hiper e hipotiroidismo.", 62.00, models.TipoPruebaEnum.TABLA, 3),
            ("Perfil Hepático", "Niveles de ALT, AST, ALP, Albúmina y Bilirrubina.", 55.00, models.TipoPruebaEnum.TABLA, 4),
            ("Perfil Renal", "Urea, Creatinina, Ácido Úrico y Electrolitos.", 42.00, models.TipoPruebaEnum.TABLA, 5),
            ("Examen de Orina (Uroanálisis)", "Evaluación física, química y microscópica de la orina.", 15.00, models.TipoPruebaEnum.ORINA, 6),
            ("Coproanálisis", "Examen parasitológico y macroscópico de heces.", 18.00, models.TipoPruebaEnum.COPROANALISIS, 7),
        ]

        # Insert Pruebas
        for nombre, descripcion, precio, tipo, orden in pruebas:
            existing = db.query(models.Prueba).filter(models.Prueba.nombre == nombre).first()
            if not existing:
                nueva_prueba = models.Prueba(nombre=nombre, descripcion=descripcion, precio_usd=precio, tipo=tipo, orden_visual=orden)
                db.add(nueva_prueba)
                
        db.commit()

        # Helper to add params
        def add_params(prueba_nombre, params_list):
            prueba = db.query(models.Prueba).filter(models.Prueba.nombre == prueba_nombre).first()
            if not prueba: return
            for nombre, unidad, cat, orden in params_list:
                existing = db.query(models.Parametro).filter(models.Parametro.prueba_id == prueba.id, models.Parametro.nombre == nombre).first()
                if not existing:
                    nuevo_param = models.Parametro(prueba_id=prueba.id, nombre=nombre, unidad=unidad, categoria=cat, orden_visual=orden)
                    db.add(nuevo_param)
        
        # Perfil Lipídico
        add_params("Perfil Lipídico", [
            ("Colesterol Total", "mg/dL", "Marcador Metabólico", 1),
            ("Triglicéridos", "mg/dL", "Ensayo Estándar", 2),
            ("HDL Colesterol", "mg/dL", "Lipoproteína de Alta Densidad", 3),
            ("LDL Colesterol", "mg/dL", "Lipoproteína de Baja Densidad", 4),
            ("VLDL Colesterol", "mg/dL", "Valor Calculado", 5),
        ])

        # Perfil Tiroideo
        add_params("Perfil Tiroideo (T3, T4, TSH)", [
            ("T3 Libre", "pg/mL", "Hormonas Tiroideas", 1),
            ("T4 Libre", "ng/dL", "Hormonas Tiroideas", 2),
            ("TSH Ultrasensible", "uIU/mL", "Hormonas Tiroideas", 3),
        ])

        # Orina
        add_params("Examen de Orina (Uroanálisis)", [
            ("Color", None, "Examen Físico", 1),
            ("Aspecto", None, "Examen Físico", 2),
            ("Densidad", None, "Examen Físico", 3),
            ("pH", None, "Examen Químico", 4),
            ("Leucocitos", None, "Examen Microscópico", 5),
            ("Hematíes", None, "Examen Microscópico", 6),
            ("Bacterias", None, "Examen Microscópico", 7),
        ])

        db.commit()
        print("Base de datos poblada exitosamente.")
    except Exception as e:
        print("Error:", e)
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
