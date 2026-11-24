import time

from fastapi import APIRouter, Depends, HTTPException, Response
from psycopg.types.json import Jsonb
from pydantic import BaseModel

from .. import audit, db, security
from ..llm import registry
from ..llm.base import LLMError

router = APIRouter(prefix="/api/settings/llm", tags=["settings"], dependencies=[Depends(security.current_user)])


def _public(row: dict) -> dict:
    return {"id": row["id"], "name": row["name"], "kind": row["kind"], "preset": row["preset"], "base_url": row["base_url"],
            "has_api_key": bool(row["api_key_enc"]), "enabled": row["enabled"]}


class ProviderIn(BaseModel):
    name: str
    kind: str
    preset: str = "custom"
    base_url: str | None = None
    api_key: str | None = None  # None = keep the stored key, "" = clear it
    enabled: bool = True


class Choice(BaseModel):
    provider_id: str
    model: str


class RoutingIn(BaseModel):
    reasoning: Choice | None = None
    embedding: Choice | None = None
    agents: dict[str, Choice | None] | None = None


class TestIn(BaseModel):
    provider_id: str
    model: str
    kind: str


def _validate(body: ProviderIn) -> None:
    if body.kind not in ("openai_compatible", "anthropic"):
        raise HTTPException(422, "kind must be 'openai_compatible' or 'anthropic'")
    if body.kind == "openai_compatible" and not (body.base_url or "").startswith(("http://", "https://")):
        raise HTTPException(422, "base_url must start with http:// or https://")


@router.get("")
def get_settings():
    with db.tx() as c:
        providers = c.execute("SELECT * FROM llm_providers ORDER BY created_at").fetchall()
    return {"providers": [_public(p) for p in providers], "routing": registry.routing(),
            "agent_roles": registry.AGENT_ROLES, "presets": registry.PRESETS}


@router.post("/providers")
def create_provider(body: ProviderIn, user: dict = Depends(security.current_user)):
    _validate(body)
    with db.tx() as c:
        row = c.execute("INSERT INTO llm_providers (name, kind, preset, base_url, api_key_enc, enabled) VALUES (%s, %s, %s, %s, %s, %s) RETURNING *",
                        (body.name.strip(), body.kind, body.preset, (body.base_url or "").strip() or None,
                         security.encrypt(body.api_key) if body.api_key else None, body.enabled)).fetchone()
        audit.record(c, actor=user["email"], actor_type="user", action="settings.provider_created", entity_type="llm_provider", entity_id=row["id"],
                     summary=row["name"], payload={"kind": row["kind"], "base_url": row["base_url"], "api_key_set": bool(body.api_key)})
    return _public(row)


@router.put("/providers/{provider_id}")
def update_provider(provider_id: str, body: ProviderIn, user: dict = Depends(security.current_user)):
    _validate(body)
    with db.tx() as c:
        old = c.execute("SELECT * FROM llm_providers WHERE id = %s", (provider_id,)).fetchone()
        if not old:
            raise HTTPException(404, "Provider not found")
        key = old["api_key_enc"] if body.api_key is None else (security.encrypt(body.api_key) if body.api_key else None)
        row = c.execute("UPDATE llm_providers SET name = %s, kind = %s, preset = %s, base_url = %s, api_key_enc = %s, enabled = %s WHERE id = %s RETURNING *",
                        (body.name.strip(), body.kind, body.preset, (body.base_url or "").strip() or None, key, body.enabled, provider_id)).fetchone()
        audit.record(c, actor=user["email"], actor_type="user", action="settings.provider_updated", entity_type="llm_provider", entity_id=provider_id,
                     summary=row["name"], payload={"kind": row["kind"], "base_url": row["base_url"], "enabled": row["enabled"],
                                                   "api_key_changed": body.api_key is not None})
    return _public(row)


@router.delete("/providers/{provider_id}", status_code=204)
def delete_provider(provider_id: str, user: dict = Depends(security.current_user)):
    r = registry.routing()
    in_use = [k for k, v in {"reasoning": r["reasoning"], "embedding": r["embedding"], **r["agents"]}.items() if v and v.get("provider_id") == provider_id]
    if in_use:
        raise HTTPException(409, f"This provider is used for: {', '.join(in_use)}. Change the model routing first.")
    with db.tx() as c:
        row = c.execute("DELETE FROM llm_providers WHERE id = %s RETURNING name", (provider_id,)).fetchone()
        if not row:
            raise HTTPException(404, "Provider not found")
        audit.record(c, actor=user["email"], actor_type="user", action="settings.provider_deleted", entity_type="llm_provider",
                     entity_id=provider_id, summary=row["name"])
    return Response(status_code=204)


@router.get("/providers/{provider_id}/models")
def models(provider_id: str):
    try:
        return {"models": registry.provider_by_id(provider_id)[1].list_models()}
    except LLMError as e:
        raise HTTPException(502, str(e))


@router.put("/routing")
def set_routing(body: RoutingIn, user: dict = Depends(security.current_user)):
    old = registry.routing()
    sent = body.model_fields_set
    new = {"reasoning": body.reasoning.model_dump() if body.reasoning else None if "reasoning" in sent else old["reasoning"],
           "embedding": body.embedding.model_dump() if body.embedding else None if "embedding" in sent else old["embedding"],
           "agents": dict(old["agents"])}
    if body.agents is not None:
        known = {r["id"] for r in registry.AGENT_ROLES}
        for role, choice in body.agents.items():
            if role not in known:
                raise HTTPException(422, f"Unknown agent role: {role}")
            new["agents"][role] = choice.model_dump() if choice else None
    with db.tx() as c:
        ids = {str(r["id"]) for r in c.execute("SELECT id FROM llm_providers").fetchall()}
        for choice in [new["reasoning"], new["embedding"], *new["agents"].values()]:
            if choice and choice["provider_id"] not in ids:
                raise HTTPException(422, "Unknown provider in routing")
        c.execute("INSERT INTO app_settings (key, value) VALUES ('llm_routing', %s) ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()",
                  (Jsonb(new),))
        audit.record(c, actor=user["email"], actor_type="user", action="settings.routing_changed", entity_type="settings", entity_id="llm_routing",
                     summary="Model routing updated", payload={"before": old, "after": new})
        affected = 0
        changed = new["embedding"] != old["embedding"]
        if changed:
            # counts across workspaces: this is a global setting (RLS is bypassed only for this aggregate via per-workspace loop)
            for w in c.execute("SELECT id FROM workspaces").fetchall():
                c.execute("SELECT set_config('app.workspace_id', %s, true)", (str(w["id"]),))
                affected += c.execute("SELECT count(*) AS n FROM documents WHERE chunk_count > 0").fetchone()["n"]
    result = registry.routing()
    if changed:
        result.update({"reindex_required": affected > 0, "documents_affected": affected})
    return result


@router.post("/test")
def test(body: TestIn):
    start = time.monotonic()
    try:
        _, provider = registry.provider_by_id(body.provider_id)
        if body.kind == "embedding":
            vector = provider.embed(body.model, ["connection test"])[0]
            return {"ok": True, "latency_ms": int((time.monotonic() - start) * 1000), "detail": "Embedding returned", "dimensions": len(vector)}
        if body.kind != "chat":
            raise HTTPException(422, "kind must be 'chat' or 'embedding'")
        result = provider.complete(body.model, "You are a connection test.", "Reply with the single word: ready", max_tokens=1024)
        return {"ok": True, "latency_ms": int((time.monotonic() - start) * 1000), "detail": f"Model {result.model} answered: {(result.text or '').strip()[:80]}"}
    except LLMError as e:
        return {"ok": False, "latency_ms": int((time.monotonic() - start) * 1000), "detail": str(e)}
