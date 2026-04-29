from database import engine
from sqlalchemy import text

try:
    with engine.connect() as conn:
        result = conn.execute(text("SELECT id, nombre, tipo FROM pruebas LIMIT 5;"))
        for row in result:
            print(dict(row._mapping))
except Exception as e:
    print(e)
