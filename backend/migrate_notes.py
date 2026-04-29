from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Leer variables del .env
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASSWORD") 
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "6543")
DB_NAME = os.getenv("DB_NAME", "postgres")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Conectando a: {DB_HOST}:{DB_PORT}")
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Añadiendo columna 'notas_tecnicas' a tabla 'ordenes_examen'...")
        try:
            conn.execute(text("ALTER TABLE ordenes_examen ADD COLUMN IF NOT EXISTS notas_tecnicas TEXT;"))
            conn.commit()
            print("¡Columna añadida exitosamente!")
        except Exception as e:
            print(f"Error en migración: {e}")

if __name__ == "__main__":
    migrate()
