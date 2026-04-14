"""
FIX: Cria as tabelas faltantes no Supabase detectadas pela auditoria.
Tabelas: whatsapp_instances, whatsapp_messages, automations, pipeline_stages
"""
import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

MIGRATIONS = [
    {
        "name": "whatsapp_instances",
        "sql": """
            CREATE TABLE IF NOT EXISTS whatsapp_instances (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                instance_name TEXT NOT NULL,
                api_key TEXT,
                status TEXT DEFAULT 'disconnected',
                webhook_url TEXT,
                is_default BOOLEAN DEFAULT false,
                connection_status JSONB,
                user_id TEXT,
                is_mock BOOLEAN DEFAULT false,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
    },
    {
        "name": "whatsapp_messages",
        "sql": """
            CREATE TABLE IF NOT EXISTS whatsapp_messages (
                id TEXT PRIMARY KEY,
                instance_id TEXT REFERENCES whatsapp_instances(id) ON DELETE CASCADE,
                direction TEXT NOT NULL CHECK (direction IN ('inbound', 'outbound')),
                phone_number TEXT NOT NULL,
                message_type TEXT DEFAULT 'text',
                content TEXT,
                status TEXT DEFAULT 'received',
                metadata JSONB,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
    },
    {
        "name": "automations",
        "sql": """
            CREATE TABLE IF NOT EXISTS automations (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                description TEXT,
                trigger_type TEXT NOT NULL,
                trigger_config JSONB DEFAULT '{}'::jsonb,
                actions JSONB DEFAULT '[]'::jsonb,
                is_active BOOLEAN DEFAULT false,
                execution_count INTEGER DEFAULT 0,
                last_executed_at TIMESTAMP,
                user_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
    },
    {
        "name": "pipeline_stages",
        "sql": """
            CREATE TABLE IF NOT EXISTS pipeline_stages (
                id TEXT PRIMARY KEY,
                pipeline_id TEXT REFERENCES pipelines(id) ON DELETE CASCADE,
                name TEXT NOT NULL,
                color TEXT DEFAULT '#6366f1',
                position INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """
    }
]


def run_migrations():
    print("[MIGRACOES] Iniciando criacao de tabelas faltantes...")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()

        for m in MIGRATIONS:
            try:
                cur.execute(m["sql"])
                print(f"  [OK] Tabela '{m['name']}' criada/verificada.")
            except Exception as e:
                print(f"  [ERRO] Tabela '{m['name']}': {e}")

        cur.close()
        conn.close()
        print("[MIGRACOES] Concluido com sucesso.")
    except Exception as e:
        print(f"[ERRO FATAL] Conexao falhou: {e}")


if __name__ == "__main__":
    run_migrations()
