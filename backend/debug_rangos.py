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
    result = conn.execute(text("SELECT id, parametro_id, sexo FROM rangos_referencia LIMIT 10;"))
    print("--- DATA IN RANGOS_REFERENCIA TABLE ---")
    for row in result:
        id, pid, sexo = row
        print(f"ID: {id} | ParamID: {pid} | Sexo: {sexo!r} (length: {len(str(sexo))})")
    print("--- END OF DATA ---")
