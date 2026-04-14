import os
import asyncio
from playwright.async_api import async_playwright
import time

BASE_URL = "https://crm.dvadvoga.com.br"
EVOLUTION_URL = "https://evolution.dvadvoga.com.br"
API_KEY = "422ec34d283626895393160a2b0e77d2"

async def run_audit():
    async with async_playwright() as p:
        print("\n[AUDITORIA] INICIANDO AUDITORIA: WHATSAPP + CRM")
        
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={'width': 1280, 'height': 800},
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) Playwright Audit"
        )
        page = await context.new_page()

        try:
            # 1. Teste de Interface CRM
            print(f"URL: Acessando {BASE_URL}...")
            await page.goto(BASE_URL)
            await page.wait_for_load_state("networkidle")
            await page.screenshot(path="audit_login.png")
            print("OK: CRM carregou com sucesso.")

            # 2. Teste de Backend Evolution API
            print("BACKEND: Testando conexao com Evolution API...")
            try:
                # Fazendo o fetch direto via navegador para validar HTTPS e CORS
                fetch_code = f"""
                    async () => {{
                        const res = await fetch('{EVOLUTION_URL}/instance/fetchInstances', {{
                            headers: {{ 'apikey': '{API_KEY}' }}
                        }});
                        const data = await res.json();
                        return {{ status: res.status, count: data.length }};
                    }}
                """
                result = await page.evaluate(fetch_code)
                print(f"EVOLUTION_API: Status {result['status']}, Instancias encontradas: {result['count']}")
                
                if result['status'] == 200:
                    print("SUCESSO: Comunicacao bidirecional ativa.")
                else:
                    print(f"AVISO: Status inesperado: {result['status']}")

            except Exception as e:
                print(f"ERRO BACKEND: {str(e)}")

        except Exception as e:
            print(f"ERRO GERAL: {str(e)}")
        finally:
            await browser.close()
            print("\n[AUDITORIA] Concluida.")

if __name__ == "__main__":
    asyncio.run(run_audit())
