"""Resolves which provider and model serve each role, from settings stored in the database.

Read on every call, so changes made in Settings apply immediately without a restart.
"""
from .. import config, db, security
from .anthropic_provider import AnthropicProvider
from .base import LLMError, Provider
from .openai_compat import OpenAICompatibleProvider

AGENT_ROLES = [
    {"id": "ingestion", "label": "Ingestion & Evidence Agent",
     "description": "Classifies uploaded documents and links them to control objectives. A light or local model is usually enough."},
]

PRESETS = [
    {"preset": "ollama", "kind": "openai_compatible", "name": "Ollama (local)", "base_url": config.OLLAMA_BASE_URL.rstrip("/") + "/v1",
     "needs_api_key": False, "suggested_models": {"reasoning": [], "embedding": ["nomic-embed-text", "bge-m3", "mxbai-embed-large"]}},
    {"preset": "lmstudio", "kind": "openai_compatible", "name": "LM Studio (local)", "base_url": "http://host.docker.internal:1234/v1",
     "needs_api_key": False, "suggested_models": {"reasoning": [], "embedding": []}},
    {"preset": "vllm", "kind": "openai_compatible", "name": "vLLM (local)", "base_url": "http://host.docker.internal:8000/v1",
     "needs_api_key": False, "suggested_models": {"reasoning": [], "embedding": []}},
    {"preset": "anthropic", "kind": "anthropic", "name": "Anthropic (Claude)", "base_url": None, "needs_api_key": True,
     "suggested_models": {"reasoning": ["claude-opus-5-5", "claude-sonnet-5-5", "claude-haiku-5-5"], "embedding": []}},
    {"preset": "openai", "kind": "openai_compatible", "name": "OpenAI", "base_url": "https://api.openai.com/v1", "needs_api_key": True,
     "suggested_models": {"reasoning": [], "embedding": ["text-embedding-3-small", "text-embedding-3-large"]}},
    {"preset": "gemini", "kind": "openai_compatible", "name": "Google Gemini", "base_url": "https://generativelanguage.googleapis.com/v1beta/openai/",
     "needs_api_key": True, "suggested_models": {"reasoning": [], "embedding": []}},
    {"preset": "azure_openai", "kind": "openai_compatible", "name": "Azure OpenAI", "base_url": "https://YOUR-RESOURCE.openai.azure.com/openai/v1/",
     "needs_api_key": True, "suggested_models": {"reasoning": [], "embedding": []}},
    {"preset": "custom", "kind": "openai_compatible", "name": "Custom OpenAI-compatible endpoint", "base_url": "",
     "needs_api_key": False, "suggested_models": {"reasoning": [], "embedding": []}},
]


def build(row: dict) -> Provider:
    key = security.decrypt(row["api_key_enc"]) if row.get("api_key_enc") else None
    if row["kind"] == "anthropic":
        if not key:
            raise LLMError("No API key stored for this Anthropic provider")
        return AnthropicProvider(api_key=key, base_url=row.get("base_url") or None)
    return OpenAICompatibleProvider(base_url=row.get("base_url"), api_key=key)


def provider_by_id(provider_id: str) -> tuple[dict, Provider]:
    with db.tx() as c:
        row = c.execute("SELECT * FROM llm_providers WHERE id = %s", (provider_id,)).fetchone()
    if not row:
        raise LLMError("Provider not found")
    if not row["enabled"]:
        raise LLMError(f"Provider '{row['name']}' is disabled")
    return row, build(row)


def routing() -> dict:
    with db.tx() as c:
        row = c.execute("SELECT value FROM app_settings WHERE key = 'llm_routing'").fetchone()
    value = (row["value"] if row else {}) or {}
    return {"reasoning": value.get("reasoning"), "embedding": value.get("embedding"),
            "agents": {r["id"]: (value.get("agents") or {}).get(r["id"]) for r in AGENT_ROLES}}


def resolve(role: str) -> tuple[Provider, str, str] | None:
    """Returns (provider, model, label) for 'embedding', 'reasoning' or an agent role; None if not configured.
    Agent roles fall back to the reasoning model."""
    r = routing()
    choice = r["embedding"] if role == "embedding" else (r["agents"].get(role) or r["reasoning"])
    if not choice or not choice.get("provider_id") or not choice.get("model"):
        return None
    row, provider = provider_by_id(choice["provider_id"])
    return provider, choice["model"], f"{row['name']}/{choice['model']}"
