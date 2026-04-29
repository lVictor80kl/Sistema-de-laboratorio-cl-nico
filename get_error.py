import requests
try:
    r = requests.get("http://127.0.0.1:8001/api/pruebas/1/parametros")
    print(f"Status: {r.status_code}")
    print(f"Body: {r.text}")
except Exception as e:
    print(f"Request failed: {e}")
