"""
AUDITORIA CIRURGICA - NEXUS CRM v2
Suite de testes automatizados para todas as funcionalidades.
Ferramentas: Python + Playwright + Requests + Psycopg2
"""
import sys
import os
import json
import time
import asyncio
import requests
import warnings
import psycopg2
from datetime import datetime
from dotenv import load_dotenv

# Suprime avisos de SSL para testes com certificado auto-assinado
warnings.filterwarnings("ignore", message="Unverified HTTPS request")

load_dotenv()

# --- CONFIGURACAO ---
CRM_URL = "https://crm.dvadvoga.com.br"
EVOLUTION_URL = os.getenv("EVOLUTION_API_URL", "https://evolution.dvadvoga.com.br")
EVOLUTION_KEY = os.getenv("EVOLUTION_GLOBAL_API_KEY", "")
DATABASE_URL = os.getenv("DATABASE_URL", "")

# --- RESULTADOS ---
results = []

def log(status, module, test, detail=""):
    icon = "PASS" if status else "FAIL"
    results.append({"status": status, "module": module, "test": test, "detail": detail})
    print(f"  [{icon}] {module} | {test} | {detail}")


def section(title):
    print(f"\n{'='*60}")
    print(f"  {title}")
    print(f"{'='*60}")


# =================================================================
# MODULO 1: BANCO DE DADOS
# =================================================================
def test_database():
    section("MODULO 1: BANCO DE DADOS (Supabase)")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        log(True, "DB", "Conexao", "Conectou ao Supabase com sucesso")

        # Tabelas essenciais
        essential_tables = ["users", "leads", "whatsapp_instances", "whatsapp_messages",
                           "whatsapp_blacklist", "automations", "appointments",
                           "pipelines", "pipeline_stages", "settings"]
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
        existing = [r[0] for r in cur.fetchall()]

        for t in essential_tables:
            found = t in existing
            log(found, "DB", f"Tabela '{t}'", "Existe" if found else "NAO ENCONTRADA")

        # Contagem de dados
        for t in ["users", "leads", "whatsapp_blacklist"]:
            if t in existing:
                cur.execute(f"SELECT count(*) FROM {t}")
                count = cur.fetchone()[0]
                log(True, "DB", f"Dados em '{t}'", f"{count} registros")

        # Tags de clientes
        if "leads" in existing:
            cur.execute("SELECT count(*) FROM leads WHERE (custom_fields->'tags')::jsonb ? '#cliente'")
            tagged = cur.fetchone()[0]
            log(tagged > 0, "DB", "Auto-Tagging #cliente", f"{tagged} leads tagueados")

        cur.close()
        conn.close()
    except Exception as e:
        log(False, "DB", "Conexao", str(e))


# =================================================================
# MODULO 2: EVOLUTION API (WhatsApp Backend)
# =================================================================
def test_evolution():
    section("MODULO 2: EVOLUTION API (WhatsApp Backend)")

    # 2.1 Health check
    try:
        r = requests.get(f"{EVOLUTION_URL}/", headers={"apikey": EVOLUTION_KEY}, verify=False, timeout=10)
        log(r.status_code == 200, "EVOLUTION", "Health Check", f"Status {r.status_code}")
    except Exception as e:
        log(False, "EVOLUTION", "Health Check", str(e))

    # 2.2 SSL Check
    try:
        r = requests.get(f"{EVOLUTION_URL}/", headers={"apikey": EVOLUTION_KEY}, verify=True, timeout=10)
        log(True, "EVOLUTION", "Certificado SSL", "Valido")
    except requests.exceptions.SSLError:
        log(False, "EVOLUTION", "Certificado SSL", "INVALIDO/Auto-assinado")
    except Exception as e:
        log(False, "EVOLUTION", "Certificado SSL", str(e))

    # 2.3 Listar instancias
    try:
        r = requests.get(f"{EVOLUTION_URL}/instance/fetchInstances",
                        headers={"apikey": EVOLUTION_KEY}, verify=False, timeout=10)
        if r.status_code == 200:
            instances = r.json()
            log(True, "EVOLUTION", "Listar Instancias", f"{len(instances)} encontradas")
            for inst in instances:
                name = inst.get("instanceName", inst.get("instance", {}).get("instanceName", "?"))
                status = inst.get("status", inst.get("instance", {}).get("status", "?"))
                log(True, "EVOLUTION", f"  Instancia: {name}", f"Status: {status}")
        else:
            log(False, "EVOLUTION", "Listar Instancias", f"HTTP {r.status_code}: {r.text[:100]}")
    except Exception as e:
        log(False, "EVOLUTION", "Listar Instancias", str(e))


# =================================================================
# MODULO 3: CRM FRONTEND (Playwright)
# =================================================================
async def test_crm_frontend():
    section("MODULO 3: CRM FRONTEND (Playwright)")
    try:
        from playwright.async_api import async_playwright
    except ImportError:
        log(False, "CRM", "Playwright", "Nao instalado. Execute: pip install playwright")
        return

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            viewport={"width": 1280, "height": 800},
            ignore_https_errors=True
        )
        page = await context.new_page()

        # 3.1 Pagina de Login
        try:
            await page.goto(CRM_URL, timeout=15000)
            await page.wait_for_load_state("networkidle")
            title = await page.title()
            log(len(title) > 0, "CRM", "Pagina Inicial", f"Titulo: {title}")

            # Verificar se tem campo de login
            has_email = await page.is_visible("input[type='email'], input[name='email'], input[placeholder*='email']")
            has_password = await page.is_visible("input[type='password']")
            log(has_email, "CRM", "Campo de Email", "Visivel" if has_email else "NAO encontrado")
            log(has_password, "CRM", "Campo de Senha", "Visivel" if has_password else "NAO encontrado")
        except Exception as e:
            log(False, "CRM", "Pagina Inicial", str(e))

        # 3.2 Verificar carregamento de JS (sem erros fatais)
        errors = []
        page.on("pageerror", lambda err: errors.append(str(err)))

        try:
            await page.goto(CRM_URL, timeout=15000)
            await page.wait_for_load_state("networkidle")
            await asyncio.sleep(2)
            log(len(errors) == 0, "CRM", "Erros de JS", f"{len(errors)} erros" if errors else "Nenhum erro")
            for e in errors[:3]:
                print(f"    -> JS Error: {e[:120]}")
        except Exception as e:
            log(False, "CRM", "Carregamento JS", str(e))

        # 3.3 Testar rotas de API do backend via fetch
        api_tests = [
            ("/api/health", "Health Check API"),
            ("/api/system/status", "System Status API"),
        ]
        for path, label in api_tests:
            try:
                resp = await page.evaluate(f"""
                    async () => {{
                        const r = await fetch('{CRM_URL}{path}');
                        return {{ status: r.status, ok: r.ok }};
                    }}
                """)
                log(resp["ok"], "CRM", label, f"Status {resp['status']}")
            except Exception as e:
                log(False, "CRM", label, str(e))

        await browser.close()


# =================================================================
# MODULO 4: WEBHOOK E BLACKLIST
# =================================================================
def test_webhook_blacklist():
    section("MODULO 4: WEBHOOK + BLACKLIST")

    # 4.1 Testar endpoint do webhook
    try:
        payload = {
            "event": "MESSAGES_UPSERT",
            "data": {
                "key": {"remoteJid": "5500000000000@s.whatsapp.net"},
                "message": {"conversation": "Teste automatizado de auditoria"}
            }
        }
        r = requests.post(f"{CRM_URL}/api/webhook/whatsapp",
                         json=payload, verify=False, timeout=10)
        log(r.status_code < 500, "WEBHOOK", "Endpoint Receptivo",
            f"Status {r.status_code}")
    except Exception as e:
        log(False, "WEBHOOK", "Endpoint Receptivo", str(e))

    # 4.2 Testar API de Blacklist (sem auth - deve retornar 401)
    try:
        r = requests.get(f"{CRM_URL}/api/settings/blacklist", verify=False, timeout=10)
        log(r.status_code == 401, "BLACKLIST", "Protecao de Auth",
            f"Status {r.status_code} ({'Protegido' if r.status_code == 401 else 'EXPOSTO'})")
    except Exception as e:
        log(False, "BLACKLIST", "Protecao de Auth", str(e))


# =================================================================
# RELATORIO FINAL
# =================================================================
def print_report():
    section("RELATORIO FINAL DE AUDITORIA")
    passed = sum(1 for r in results if r["status"])
    failed = sum(1 for r in results if not r["status"])
    total = len(results)

    print(f"\n  Total de testes: {total}")
    print(f"  Aprovados:      {passed}")
    print(f"  Reprovados:     {failed}")
    print(f"  Taxa de Sucesso: {(passed/total*100):.1f}%\n" if total > 0 else "")

    if failed > 0:
        print("  FALHAS DETECTADAS:")
        for r in results:
            if not r["status"]:
                print(f"    [FAIL] {r['module']} | {r['test']} | {r['detail']}")

    print(f"\n  Auditoria concluida em {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*60}\n")


# =================================================================
# MAIN
# =================================================================
async def main():
    print(f"\n{'='*60}")
    print(f"  AUDITORIA CIRURGICA - NEXUS CRM v2")
    print(f"  Data: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"  CRM: {CRM_URL}")
    print(f"  Evolution: {EVOLUTION_URL}")
    print(f"{'='*60}")

    test_database()
    test_evolution()
    await test_crm_frontend()
    test_webhook_blacklist()
    print_report()

if __name__ == "__main__":
    asyncio.run(main())
