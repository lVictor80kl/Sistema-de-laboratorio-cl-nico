import requests
import datetime

# 1. Crear un paciente
paciente_data = {
    "cedula": "V-12345678",
    "nombre": "Juan",
    "apellido": "Perez",
    "fecha_nacimiento": "1990-01-01",
    "sexo": "M"
}
r1 = requests.post("http://127.0.0.1:8000/api/pacientes/", json=paciente_data)
if r1.status_code != 201:
    print(f"Error creando paciente: {r1.text}")
    exit(1)

paciente_id = r1.json()["id"]

# 2. Crear una orden
orden_data = {
    "paciente_id": paciente_id,
    "fecha": datetime.date.today().isoformat(),
    "estado_pago": "Pendiente",
    "monto_usd": 15.0,
    "monto_bs": 600.0,
    "notas_tecnicas": "Testeando orden"
}
r2 = requests.post("http://127.0.0.1:8000/api/ordenes/", json=orden_data)
print(f"Status Orden: {r2.status_code}")
print(f"Response: {r2.text}")
