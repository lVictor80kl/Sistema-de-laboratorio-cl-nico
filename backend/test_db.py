import os
from dotenv import load_dotenv
import psycopg2
from urllib.parse import quote_plus

load_dotenv(override=True)

user = os.getenv("DB_USER")
# Vamos a codificar la URL por si acaso
user_encoded = quote_plus(user)
password = quote_plus(os.getenv("DB_PASSWORD", ""))
host = os.getenv("DB_HOST", "")
port = os.getenv("DB_PORT", "5432")
db = os.getenv("DB_NAME", "postgres")

print(f"Buscando conectar con: postgresql://{user_encoded}:***@{host}:{port}/{db}")

try:
    conn = psycopg2.connect(
        dbname=db,
        user=user,
        password=os.getenv("DB_PASSWORD"),
        host=host,
        port=port,
        sslmode="require"
    )
    print("¡CONECTADO CON PSYCOPG2 CON ÉXITO!")
    conn.close()
except Exception as e:
    print("Error directo de Psycopg2:", e)
