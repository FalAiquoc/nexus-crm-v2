import requests
import json

URL = "https://evolution.dvadvoga.com.br/instance/fetchInstances"
KEY = "422ec34d283626895393160a2b0e77d2"

def check():
    print("[CHECK] Testando Evolution API via Python puro...")
    try:
        response = requests.get(URL, headers={"apikey": KEY}, timeout=10)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            instances = response.json()
            print(f"Sucesso! Encontradas {len(instances)} instancias.")
            for inst in instances:
                print(f" - Instancia: {inst.get('instanceName')} | Status: {inst.get('status')}")
        else:
            print(f"Erro: {response.text}")
    except Exception as e:
        print(f"Falha na conexao: {e}")

if __name__ == "__main__":
    check()
