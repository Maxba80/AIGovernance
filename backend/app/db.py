"""Database access: plain SQL through psycopg.

Every application connection drops to the unprivileged role `aigov_app`, so
row-level security applies. `tx(workspace_id)` scopes a transaction to one
workspace; without it, workspace tables return no rows.
"""
import contextlib
import pathlib

import psycopg
from psycopg.rows import dict_row
from psycopg_pool import ConnectionPool

from . import config

_pool: ConnectionPool | None = None
MIGRATIONS = pathlib.Path(__file__).parent / "migrations"


def migrate() -> list[str]:
    """Apply numbered SQL files once each, as the database owner, under an advisory lock."""
    applied = []
    with psycopg.connect(config.DATABASE_URL, autocommit=False) as conn:
        conn.execute("SELECT pg_advisory_xact_lock(4242001)")
        conn.execute("CREATE TABLE IF NOT EXISTS schema_migrations (name text PRIMARY KEY, applied_at timestamptz NOT NULL DEFAULT now())")
        done = {r[0] for r in conn.execute("SELECT name FROM schema_migrations")}
        for f in sorted(MIGRATIONS.glob("*.sql")):
            if f.name not in done:
                conn.execute(f.read_text())
                conn.execute("INSERT INTO schema_migrations (name) VALUES (%s)", (f.name,))
                applied.append(f.name)
        conn.commit()
    return applied


def _configure(conn: psycopg.Connection) -> None:
    conn.execute("SET ROLE aigov_app")
    conn.commit()


def pool() -> ConnectionPool:
    global _pool
    if _pool is None:
        _pool = ConnectionPool(config.DATABASE_URL, min_size=1, max_size=8, configure=_configure,
                               kwargs={"row_factory": dict_row}, open=True)
    return _pool


@contextlib.contextmanager
def tx(workspace_id: str | None = None):
    """One transaction. Commits on success, rolls back on error."""
    with pool().connection() as conn:
        with conn.transaction():
            # always (re)set: pooled connections must not leak a previous scope
            conn.execute("SELECT set_config('app.workspace_id', %s, true)", (str(workspace_id) if workspace_id else "",))
            yield conn
