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
    print("--- ALL COLUMNS IN 'parametros' ---")
    res = conn.execute(text("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'parametros' ORDER BY ordinal_position;"))
    for row in res:
        print(f"Col: {row[0]!r} | Type: {row[1]}")
