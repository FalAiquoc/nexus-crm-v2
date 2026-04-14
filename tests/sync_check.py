import requests
import urllib3

urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

# Testando rotas comuns da v2
ENDPOINTS = ["/", "/instance/fetchInstances"]
KEYS = [
    "422ec34d283626895393160a2b0e77d2",
    "nexu_evolution_stable_2026_key"
]

def test_sync():
    print("[SYNC] Diagnosing Evolution API Connection...")
    for key in KEYS:
        print(f"\n--- Testing Key: {key[:10]}... ---")
        for ep in ENDPOINTS:
            url = f"https://evolution.dvadvoga.com.br{ep}"
            print(f"Endpoint: {ep}")
            try:
                response = requests.get(url, headers={"apikey": key}, timeout=10, verify=False)
                print(f"  Status: {response.status_code}")
                if response.status_code == 200:
                    print(f"  [SUCCESS] Valid key and endpoint!")
                    if ep == "/":
                        print(f"  Data: {response.text[:50]}...")
            except Exception as e:
                print(f"  [ERROR] {str(e)}")

if __name__ == "__main__":
    test_sync()
