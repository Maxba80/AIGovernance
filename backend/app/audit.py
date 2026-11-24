"""Tamper-evident audit trail.

Each entry stores hash = SHA-256(canonical JSON of its fields + prev_hash).
Altering or removing any earlier entry changes every later hash, which
`verify()` detects by recomputing the chain.
"""
import datetime as dt
import hashlib
import json

GENESIS = "0" * 64
FIELDS = ("seq", "ts", "workspace_id", "actor", "actor_type", "action", "entity_type",
          "entity_id", "summary", "payload", "model", "sources", "prev_hash")


def canonical(value) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, default=str)


def compute_hash(entry: dict) -> str:
    return hashlib.sha256(canonical({k: entry[k] for k in FIELDS}).encode("utf-8")).hexdigest()


def record(conn, *, actor: str, actor_type: str, action: str, workspace_id: str | None = None,
           entity_type: str | None = None, entity_id: str | None = None, summary: str | None = None,
           payload: dict | None = None, model: str | None = None, sources: list | None = None) -> dict:
    """Append one entry inside the caller's transaction (so the entry and the change commit together)."""
    conn.execute("SELECT pg_advisory_xact_lock(4242002)")  # serialise writers: one chain
    last = conn.execute("SELECT seq, hash FROM audit_log ORDER BY seq DESC LIMIT 1").fetchone()
    entry = {
        "seq": (last["seq"] + 1) if last else 1,
        "ts": dt.datetime.now(dt.timezone.utc).isoformat(timespec="microseconds"),
        "workspace_id": str(workspace_id) if workspace_id else None,
        "actor": actor, "actor_type": actor_type, "action": action,
        "entity_type": entity_type, "entity_id": str(entity_id) if entity_id else None,
        "summary": summary, "payload": canonical(payload or {}), "model": model,
        "sources": canonical(sources or []), "prev_hash": last["hash"] if last else GENESIS,
    }
    entry["hash"] = compute_hash(entry)
    cols = FIELDS + ("hash",)
    conn.execute(f"INSERT INTO audit_log ({', '.join(cols)}) VALUES ({', '.join(['%s'] * len(cols))})",
                 [entry[c] for c in cols])
    return entry


def verify(conn) -> dict:
    prev, checked = GENESIS, 0
    for row in conn.execute("SELECT * FROM audit_log ORDER BY seq"):
        row["workspace_id"] = str(row["workspace_id"]) if row["workspace_id"] else None
        if row["prev_hash"] != prev or row["seq"] != checked + 1 or compute_hash(row) != row["hash"]:
            return {"ok": False, "checked": checked, "first_broken_seq": row["seq"], "head_hash": prev}
        prev, checked = row["hash"], checked + 1
    return {"ok": True, "checked": checked, "first_broken_seq": None, "head_hash": prev}
