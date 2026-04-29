from sqlalchemy import create_engine, text
import os
from dotenv import load_dotenv

load_dotenv()

# Leer variables del .env
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASSWORD") # Corregido de DB_PASS a DB_PASSWORD
DB_HOST = os.getenv("DB_HOST")
DB_PORT = os.getenv("DB_PORT", "6543")
DB_NAME = os.getenv("DB_NAME", "postgres")

DATABASE_URL = f"postgresql://{DB_USER}:{DB_PASS}@{DB_HOST}:{DB_PORT}/{DB_NAME}"

print(f"Conectando a: {DB_HOST}:{DB_PORT} (User: {DB_USER})")
engine = create_engine(DATABASE_URL)

def migrate():
    with engine.connect() as conn:
        print("Añadiendo columnas a tabla 'pruebas'...")
        try:
            # PostgreSQL syntax
            conn.execute(text("ALTER TABLE pruebas ADD COLUMN IF NOT EXISTS descripcion VARCHAR;"))
            conn.execute(text("ALTER TABLE pruebas ADD COLUMN IF NOT EXISTS precio_usd FLOAT DEFAULT 0.0;"))
            conn.commit()
            print("¡Columnas añadidas exitosamente!")
        except Exception as e:
            print(f"Error en migración: {e}")

if __name__ == "__main__":
    migrate()
