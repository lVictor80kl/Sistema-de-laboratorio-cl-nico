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

with engine.connect() as conn:
    result = conn.execute(text("SELECT id, nombre, tipo FROM pruebas;"))
    print("--- DATA IN PRUEBAS TABLE ---")
    for row in result:
        id, nombre, tipo = row
        print(f"ID: {id} | Nombre: {nombre!r} | Tipo: {tipo!r} (length: {len(str(tipo))})")
    print("--- END OF DATA ---")
