from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from .. import audit, db, security

router = APIRouter(prefix="/api/auth", tags=["auth"])


class Login(BaseModel):
    email: str
    password: str


@router.post("/login")
def login(body: Login):
    with db.tx() as c:
        user = c.execute("SELECT * FROM users WHERE lower(email) = lower(%s)", (body.email.strip(),)).fetchone()
        if not user or not security.verify_password(body.password, user["password_hash"]):
            audit.record(c, actor=body.email.strip()[:200], actor_type="user", action="auth.login_failed", summary="Failed sign-in attempt")
            ok = False
        else:
            audit.record(c, actor=user["email"], actor_type="user", action="auth.login", entity_type="user", entity_id=user["id"], summary="Signed in")
            ok = True
    if not ok:
        raise HTTPException(401, "Wrong email or password")
    return {"access_token": security.create_token(str(user["id"])),
            "user": {"id": str(user["id"]), "email": user["email"], "name": user["name"], "role": user["role"]}}


@router.get("/me")
def me(user: dict = Depends(security.current_user)):
    return user
