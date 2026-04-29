import urllib.request
import json

url = "http://127.0.0.1:8000/api/pruebas/1/parametros"
try:
    with urllib.request.urlopen(url) as response:
        print(f"Status: {response.getcode()}")
        print(f"Body: {response.read().decode()}")
except urllib.error.HTTPError as e:
    print(f"Status: {e.code}")
    print(f"Body: {e.read().decode()}")
except Exception as e:
    print(f"Request failed: {e}")
