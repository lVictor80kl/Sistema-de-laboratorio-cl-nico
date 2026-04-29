from sqlalchemy import text
import sys
import os

# Añadir el directorio actual al path para importar database
sys.path.append(os.getcwd())
from database import engine

def migrate():
    with engine.connect() as conn:
        print("Iniciando migración manual...")
        
        # 1. Agregar tipo a pruebas
        try:
            conn.execute(text("ALTER TABLE pruebas ADD COLUMN tipo VARCHAR DEFAULT 'tabla'"))
            conn.commit()
            print("Columna 'tipo' añadida a 'pruebas'")
        except Exception as e:
            print(f"Error o ya existe 'tipo' en 'pruebas': {e}")
            conn.rollback()

        # 2. Agregar categoria a parametros
        try:
            conn.execute(text("ALTER TABLE parametros ADD COLUMN categoria VARCHAR"))
            conn.commit()
            print("Columna 'categoria' añadida a 'parametros'")
        except Exception as e:
            print(f"Error o ya existe 'categoria' en 'parametros': {e}")
            conn.rollback()
            
        print("Migración finalizada.")

if __name__ == "__main__":
    migrate()
