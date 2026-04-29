import os
import sys
from sqlalchemy import text
from database import engine

def apply_migration():
    with engine.begin() as conn:
        print("Migrando Resultados_Parametro...")
        try:
            conn.execute(text("ALTER TABLE resultados_parametro ADD COLUMN rango_referencia_manual VARCHAR;"))
            print("OK. Columna rango_referencia_manual agregada exitosamente.")
        except Exception as e:
            err = str(e)
            if "already exists" in err or "duplicate column" in err:
                print("Skipped: La columna ya existía.")
            else:
                print(f"Error inesperado o dialect mismatches: {err}")

if __name__ == "__main__":
    apply_migration()
