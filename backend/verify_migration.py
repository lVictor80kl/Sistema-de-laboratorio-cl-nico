import os
from sqlalchemy import create_engine, text
from dotenv import load_dotenv

load_dotenv(override=True)

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")

URL = f"postgresql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}:{DB_PORT}/{DB_NAME}?sslmode=require"
engine = create_engine(URL)

commands = [
    "ALTER TABLE parametros ADD COLUMN IF NOT EXISTS categoria VARCHAR;",
    "ALTER TABLE pruebas ADD COLUMN IF NOT EXISTS descripcion VARCHAR;",
    "ALTER TABLE pruebas ADD COLUMN IF NOT EXISTS precio_usd FLOAT DEFAULT 0.0;",
    "ALTER TABLE ordenes_examen ADD COLUMN IF NOT EXISTS notas_tecnicas VARCHAR;",
]

with engine.connect().execution_options(isolation_level="AUTOCOMMIT") as conn:
    print("--- CHECKING COLUMNS BEFORE ---")
    res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'parametros';"))
    cols = [r[0] for r in res]
    print(f"Columns in 'parametros': {cols}")

    print("\n--- RUNNING MIGRATIONS ---")
    for cmd in commands:
        try:
            conn.execute(text(cmd))
            print(f"SUCCESS: {cmd}")
        except Exception as e:
            print(f"FAILED: {cmd} | Error: {e}")

    print("\n--- CHECKING COLUMNS AFTER ---")
    res = conn.execute(text("SELECT column_name FROM information_schema.columns WHERE table_name = 'parametros';"))
    cols = [r[0] for r in res]
    print(f"Columns in 'parametros': {cols}")
