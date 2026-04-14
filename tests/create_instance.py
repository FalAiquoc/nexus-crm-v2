import requests
import json

# Dados sincronizados
BASE_URL = "https://evolution.srv1477093.hstgr.cloud"
GLOBAL_KEY = "nexu_evolution_stable_2026_key"
INSTANCE_NAME = "nexus_main"
# WEBHOOK_URL = "https://crm.dvadvoga.com.br/api/webhook/whatsapp"

def create_instance():
    print(f"[EXECUTION] Criando instancia '{INSTANCE_NAME}'...")
    url = f"{BASE_URL}/instance/create"
    
    payload = {
        "instanceName": INSTANCE_NAME,
        "token": "crm_nexus_key_2026",
        "qrcode": True,
        "integration": "WHATSAPP-BAILEYS",
        "reject_call": True,
        "msg_call": "Ola! No momento nao recebemos chamadas por aqui. Por favor, envie uma mensagem de texto.",
        "groups_ignore": True
    }
    
    headers = {
        "Content-Type": "application/json",
        "apikey": GLOBAL_KEY
    }

    try:
        response = requests.post(url, json=payload, headers=headers, timeout=30)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            data = response.json()
            print("SUCCESS! Instancia criada com sucesso.")
            # print(f"QR Code (Base64) recebido. Tamanho: {len(data.get('qrcode', {}).get('base64', ''))}")
            print(f"Token da Instancia: {data.get('hash', {}).get('apikey', 'N/A')}")
            return True
        elif response.status_code == 403:
            print("ERROR: Unauthorized (Chave API pode estar errada no backend da Evolution).")
        else:
            print(f"ERROR: {response.text}")
    except Exception as e:
        print(f"FAIL: {str(e)}")
    return False

if __name__ == "__main__":
    create_instance()
