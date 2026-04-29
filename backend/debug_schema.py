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
    print("--- DB CONTEXT ---")
    print(f"Current User: {conn.execute(text('SELECT current_user;')).scalar()}")
    print(f"Current Database: {conn.execute(text('SELECT current_database();')).scalar()}")
    print(f"Search Path: {conn.execute(text('SHOW search_path;')).scalar()}")
    
    res = conn.execute(text("SELECT table_schema, table_name FROM information_schema.tables WHERE table_name = 'parametros';"))
    for row in res:
        print(f"Found table: {row[0]}.{row[1]}")
    
    res = conn.execute(text("SELECT table_schema, column_name FROM information_schema.columns WHERE table_name = 'parametros' AND column_name = 'categoria';"))
    for row in res:
        print(f"Found column: {row[0]}.{row[1]}.categoria")
