"""
ViralCommerce AI — Local Startup Script
========================================
Instala dependências, cria o banco SQLite, popula com dados demo
e inicia o servidor FastAPI — tudo com um único comando.

Uso:
    python start-local.py           # instala deps + inicia
    python start-local.py --reset   # reinicia o banco do zero
    python start-local.py --no-seed # não popula dados demo
    python start-local.py --port 9000
"""
import sys
import os
import subprocess
import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).parent
PYTHON = sys.executable

# ── Cores no terminal ──────────────────────────────────────────────────────────
GREEN  = "\033[92m"
YELLOW = "\033[93m"
RED    = "\033[91m"
BLUE   = "\033[94m"
BOLD   = "\033[1m"
RESET  = "\033[0m"

def ok(msg):    print(f"{GREEN}✅ {msg}{RESET}")
def warn(msg):  print(f"{YELLOW}⚠️  {msg}{RESET}")
def err(msg):   print(f"{RED}❌ {msg}{RESET}")
def info(msg):  print(f"{BLUE}ℹ️  {msg}{RESET}")
def step(msg):  print(f"\n{BOLD}{BLUE}▶ {msg}{RESET}")


def run(cmd: list, cwd=None, check=True, capture=False):
    return subprocess.run(
        cmd, cwd=cwd or ROOT,
        check=check,
        capture_output=capture,
        text=True,
    )


def pip_install():
    step("Instalando dependências Python...")
    req = ROOT / "requirements-local.txt"
    if not req.exists():
        err("requirements-local.txt não encontrado!")
        sys.exit(1)
    run([PYTHON, "-m", "pip", "install", "-r", str(req), "--quiet"])
    ok("Dependências instaladas")


def create_env(reset=False):
    step("Configurando .env...")
    env_file = ROOT / ".env"

    if env_file.exists() and not reset:
        ok(".env já existe — mantendo configuração atual")
        return

    import secrets
    secret_key = secrets.token_hex(32)
    db_path = ROOT / "data" / "viralcommerce.db"
    db_path.parent.mkdir(exist_ok=True)

    env_content = f"""# ── ViralCommerce AI — Configuração Local ────────────────────
# Gerado automaticamente por start-local.py
# Para produção, edite com suas chaves reais.

# App
APP_NAME=ViralCommerce AI
APP_VERSION=1.0.0
ENVIRONMENT=development
DEBUG=true
SECRET_KEY={secret_key}
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000

# Banco de Dados (SQLite local — troque por PostgreSQL em produção)
DATABASE_URL=sqlite+aiosqlite:///{db_path.as_posix()}

# Redis (fakeredis em modo local — sem precisar instalar Redis)
REDIS_URL=fakeredis://
CELERY_BROKER_URL=memory://
CELERY_RESULT_BACKEND=cache+memory://

# ClickHouse (desabilitado no modo local)
CLICKHOUSE_HOST=localhost
CLICKHOUSE_PORT=9000
CLICKHOUSE_DB=viralcommerce
CLICKHOUSE_USER=default
CLICKHOUSE_PASSWORD=

# Elasticsearch (desabilitado no modo local)
ELASTICSEARCH_URL=http://localhost:9200

# Kafka (desabilitado no modo local)
KAFKA_BOOTSTRAP_SERVERS=localhost:9092

# ── Chaves de API (opcionais no modo demo) ──────────────────
# Preencha para ativar geração de conteúdo AI real
ANTHROPIC_API_KEY=
LLM_MODEL=claude-sonnet-4-6

# Redes de anúncio (opcional)
META_ACCESS_TOKEN=
GOOGLE_ADS_DEVELOPER_TOKEN=
TIKTOK_ADS_ACCESS_TOKEN=

# APIs de fornecedores (opcional)
ALIEXPRESS_APP_KEY=
CJ_DROPSHIPPING_API_KEY=

# YouTube API (opcional)
YOUTUBE_API_KEY=
"""
    env_file.write_text(env_content, encoding="utf-8")
    ok(f".env criado em {env_file}")
    info("Edite .env para adicionar suas chaves de API reais")


def run_migrations():
    step("Criando tabelas do banco de dados...")
    try:
        # Add project to path
        env = os.environ.copy()
        env["PYTHONPATH"] = str(ROOT)

        # Load .env for the subprocess
        from dotenv import load_dotenv
        load_dotenv(ROOT / ".env")

        result = run(
            [PYTHON, "-m", "alembic", "upgrade", "head"],
            cwd=ROOT,
            check=False,
        )
        if result.returncode != 0:
            warn("Alembic migration falhou — criando tabelas via SQLAlchemy diretamente...")
            _create_tables_directly()
        else:
            ok("Migrações executadas")
    except Exception as e:
        warn(f"Migration error: {e} — criando tabelas via SQLAlchemy...")
        _create_tables_directly()


def _create_tables_directly():
    """Fallback: cria tabelas diretamente via SQLAlchemy metadata."""
    import asyncio
    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")
    sys.path.insert(0, str(ROOT))

    async def _create():
        from sqlalchemy.ext.asyncio import create_async_engine
        from backend.core.database import Base
        from backend.models import *  # noqa

        db_url = os.getenv("DATABASE_URL")
        engine = create_async_engine(db_url)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await engine.dispose()

    asyncio.run(_create())
    ok("Tabelas criadas via SQLAlchemy")


def seed_data(reset=False):
    step("Populando banco com dados demo...")
    sys.path.insert(0, str(ROOT))

    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")

    try:
        import asyncio

        # Dynamic import after deps are installed
        seed_module_path = ROOT / "database" / "seed.py"
        import importlib.util
        spec = importlib.util.spec_from_file_location("seed", seed_module_path)
        seed_mod = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(seed_mod)
        asyncio.run(seed_mod.seed(reset=reset))
    except Exception as e:
        warn(f"Seed falhou: {e}")
        warn("Continuando sem dados demo...")


def print_banner(port: int):
    print(f"""
{BOLD}{GREEN}
╔══════════════════════════════════════════════════════════╗
║          ViralCommerce AI — Servidor Local               ║
╚══════════════════════════════════════════════════════════╝
{RESET}
  {BOLD}Backend API:{RESET}   http://localhost:{port}
  {BOLD}Docs (Swagger):{RESET} http://localhost:{port}/docs
  {BOLD}Frontend:{RESET}      http://localhost:3000  (rode em outro terminal)

  {BOLD}Demo Login:{RESET}
    Email:    demo@viralcommerce.ai
    Senha:    Demo1234!

  {YELLOW}Para iniciar o frontend:{RESET}
    node start-frontend.js dev

  Pressione Ctrl+C para parar.
""")


def start_server(port: int):
    step(f"Iniciando FastAPI na porta {port}...")
    sys.path.insert(0, str(ROOT))

    from dotenv import load_dotenv
    load_dotenv(ROOT / ".env")

    # Patch uvicorn call
    os.execv(PYTHON, [
        PYTHON, "-m", "uvicorn",
        "backend.main:create_app",
        "--factory",
        "--host", "0.0.0.0",
        "--port", str(port),
        "--reload",
        "--reload-dir", str(ROOT / "backend"),
        "--log-level", "info",
    ])


def main():
    parser = argparse.ArgumentParser(description="ViralCommerce AI — Local Startup")
    parser.add_argument("--reset",   action="store_true", help="Reinicia o banco do zero")
    parser.add_argument("--no-seed", action="store_true", help="Não popula dados demo")
    parser.add_argument("--no-install", action="store_true", help="Pula instalação de deps")
    parser.add_argument("--port", type=int, default=8000, help="Porta do servidor (padrão: 8000)")
    args = parser.parse_args()

    print(f"""
{BOLD}{BLUE}
  ██╗   ██╗██╗██████╗  █████╗ ██╗      ██████╗ ██████╗ ███╗   ███╗
  ██║   ██║██║██╔══██╗██╔══██╗██║     ██╔════╝██╔═══██╗████╗ ████║
  ██║   ██║██║██████╔╝███████║██║     ██║     ██║   ██║██╔████╔██║
  ╚██╗ ██╔╝██║██╔══██╗██╔══██║██║     ██║     ██║   ██║██║╚██╔╝██║
   ╚████╔╝ ██║██║  ██║██║  ██║███████╗╚██████╗╚██████╔╝██║ ╚═╝ ██║
    ╚═══╝  ╚═╝╚═╝  ╚═╝╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═════╝ ╚═╝     ╚═╝
{RESET}""")

    # Step 1 — Install deps
    if not args.no_install:
        pip_install()

    # Step 2 — Create .env
    create_env(reset=args.reset)

    # Step 3 — Migrations
    run_migrations()

    # Step 4 — Seed
    if not args.no_seed:
        seed_data(reset=args.reset)

    # Step 5 — Start server
    print_banner(args.port)
    start_server(args.port)


if __name__ == "__main__":
    main()
