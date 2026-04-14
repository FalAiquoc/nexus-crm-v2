import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def fix_db():
    print("[FIX] INICIANDO REPARO DO BANCO DE DADOS EM PRODUCAO")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()

        # 1. Criar Blacklist
        print("FIX: Criando tabela whatsapp_blacklist...")
        cur.execute("""
            CREATE TABLE IF NOT EXISTS whatsapp_blacklist (
                id SERIAL PRIMARY KEY,
                phone_number TEXT UNIQUE NOT NULL,
                description TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. Migrar Tags de Clientes (Retroativo)
        print("FIX: Aplicando tag #cliente em todos os leads (retroativo)...")
        # SQL que adiciona #cliente se não existir no JSONB
        cur.execute("""
            UPDATE leads 
            SET custom_fields = jsonb_set(
                COALESCE(custom_fields, '{}'::jsonb), 
                '{tags}', 
                (COALESCE(custom_fields->'tags', '[]'::jsonb) || '["#cliente"]'::jsonb)
            )
            WHERE NOT (COALESCE(custom_fields->'tags', '[]'::jsonb) ? '#cliente');
        """)

        cur.close()
        conn.close()
        print("[FIX] Banco de dados reparado e tagueado com sucesso.")

    except Exception as e:
        print(f"ERROR: Falha ao reparar banco: {e}")

if __name__ == "__main__":
    fix_db()
