"""Runtime configuration, read once from environment variables (see .env.example)."""
import os

VERSION = "0.1.0"
DATABASE_URL = os.environ.get("DATABASE_URL", "postgresql://aigov:aigov@localhost:5432/aigov")
SECRET_KEY = os.environ.get("SECRET_KEY", "")
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL", "admin@example.com")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "")
ADMIN_NAME = os.environ.get("ADMIN_NAME", "Administrator")
KB_DIR = os.environ.get("KB_DIR", "/kb")
UPLOAD_DIR = os.environ.get("UPLOAD_DIR", "/data/uploads")
EXPORT_DIR = os.environ.get("EXPORT_DIR", "/data/exports")
OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
TOKEN_TTL_HOURS = int(os.environ.get("TOKEN_TTL_HOURS", "12"))
MAX_UPLOAD_MB = int(os.environ.get("MAX_UPLOAD_MB", "100"))


def require_secrets() -> None:
    """Refuse to start with missing or placeholder secrets."""
    problems = []
    if len(SECRET_KEY) < 32 or SECRET_KEY.startswith("change-me"):
        problems.append("SECRET_KEY must be set to a random string of at least 32 characters")
    if len(ADMIN_PASSWORD) < 10 or ADMIN_PASSWORD.startswith("change-me"):
        problems.append("ADMIN_PASSWORD must be set (at least 10 characters)")
    if problems:
        raise SystemExit("Configuration error: " + "; ".join(problems))
