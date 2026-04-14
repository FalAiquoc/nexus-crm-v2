import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def run_db_audit():
    print("\n[AUDITORIA] INICIANDO AUDITORIA DE DADOS")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        # 1. Verificando Blacklist
        cur.execute("SELECT count(*) FROM whatsapp_blacklist;")
        bl_count = cur.fetchone()[0]
        print(f"DATABASE: Tabela WhatsApp Blacklist possui {bl_count} registros.")

        # 2. Verificando Saúde das Tags de Clientes
        cur.execute("SELECT count(*) FROM leads WHERE (custom_fields->'tags')::jsonb ? '#cliente';")
        client_count = cur.fetchone()[0]
        print(f"DATABASE: Leads com Tag #cliente: {client_count} encontrados.")

        cur.close()
        conn.close()
        print("\n[AUDITORIA] Concluida com exito.")

    except Exception as e:
        print(f"ERROR: Erro na auditoria de dados: {e}")

if __name__ == "__main__":
    run_db_audit()
