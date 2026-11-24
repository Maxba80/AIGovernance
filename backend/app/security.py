"""Password hashing, access tokens and encryption of stored API keys."""
import base64
import datetime as dt
import hashlib

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from cryptography.fernet import Fernet, InvalidToken
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from . import config, db

_ph = PasswordHasher()
_bearer = HTTPBearer(auto_error=False)


def hash_password(password: str) -> str:
    return _ph.hash(password)


def verify_password(password: str, hashed: str) -> bool:
    try:
        return _ph.verify(hashed, password)
    except VerifyMismatchError:
        return False


def create_token(user_id: str) -> str:
    exp = dt.datetime.now(dt.timezone.utc) + dt.timedelta(hours=config.TOKEN_TTL_HOURS)
    return jwt.encode({"sub": user_id, "exp": exp}, config.SECRET_KEY, algorithm="HS256")


def current_user(cred: HTTPAuthorizationCredentials | None = Depends(_bearer)) -> dict:
    if cred is None:
        raise HTTPException(401, "Not authenticated")
    try:
        sub = jwt.decode(cred.credentials, config.SECRET_KEY, algorithms=["HS256"])["sub"]
    except jwt.PyJWTError:
        raise HTTPException(401, "Session expired or invalid")
    with db.tx() as c:
        user = c.execute("SELECT id, email, name, role FROM users WHERE id = %s", (sub,)).fetchone()
    if not user:
        raise HTTPException(401, "Unknown user")
    user["id"] = str(user["id"])
    return user


def _fernet() -> Fernet:
    return Fernet(base64.urlsafe_b64encode(hashlib.sha256(("apikeys:" + config.SECRET_KEY).encode()).digest()))


def encrypt(value: str) -> str:
    return _fernet().encrypt(value.encode()).decode()


def decrypt(value: str) -> str:
    try:
        return _fernet().decrypt(value.encode()).decode()
    except InvalidToken:
        raise HTTPException(500, "A stored API key cannot be decrypted: SECRET_KEY has changed. Re-enter the key in Settings.")
