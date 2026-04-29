import os
from sqlalchemy import create_engine, URL
from sqlalchemy.orm import declarative_base, sessionmaker
from dotenv import load_dotenv

import os
env_path = os.path.join(os.path.dirname(__file__), ".env")
load_dotenv(env_path, override=True)

DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")
DB_NAME = os.getenv("DB_NAME")

# URL de conexión a PostgreSQL
# Para Supabase, a veces es necesario usar el puerto 6543 (Transaction Pooler)
# y añadir sslmode=require para conexiones remotas seguras.
# Crear URL de forma segura codificando contraseña o usuario
SQLALCHEMY_DATABASE_URL = URL.create(
    drivername="postgresql",
    username=DB_USER,
    password=DB_PASSWORD,
    host=DB_HOST,
    port=DB_PORT,
    database=DB_NAME,
    query={"sslmode": "require"}
)

# Crear el motor de SQLAlchemy con configuración de pooling recomendada para Supabase
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True
)

# Crear la fábrica de sesiones
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base para los modelos
Base = declarative_base()

# Dependencia para obtener la sesión de base de datos en las rutas
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
