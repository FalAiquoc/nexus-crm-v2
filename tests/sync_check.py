import requests
import json

# Valores sincronizados do .env
URL = "https://evolution.srv1477093.hstgr.cloud/instance/fetchInstances"
KEY = "nexu_evolution_stable_2026_key"

def verify_sync():
    print("[VALIDATION] Testing synchronized connection...")
    try:
        response = requests.get(URL, headers={"apikey": KEY}, timeout=15)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 200:
            instances = response.json()
            print(f"SUCCESS! Found {len(instances)} instances.")
            for inst in instances:
                name = inst.get('instanceName', 'Unknown')
                status = inst.get('status', 'unknown')
                print(f"  - Instance: {name} | Status: {status}")
            return True
        else:
            print(f"ERROR ({response.status_code}): {response.text}")
            return False
    except Exception as e:
        print(f"Network failure: {str(e)}")
        return False

if __name__ == "__main__":
    verify_sync()
