"""
Auth API — JWT authentication
"""
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jose import JWTError, jwt
from passlib.context import CryptContext
from pydantic import BaseModel, EmailStr
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from backend.core.config import settings
from backend.core.database import get_db
from backend.models.user import User

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/token")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours


# ── Pydantic schemas ──────────────────────────────────────────────────────────

class RegisterBody(BaseModel):
    email: str
    password: str
    full_name: str = ""
    plan: str = "free"


class LoginBody(BaseModel):
    email: str
    password: str


# ── Helpers ───────────────────────────────────────────────────────────────────

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES))
    to_encode["exp"] = expire
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    creds_exc = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if not user_id:
            raise creds_exc
    except JWTError:
        raise creds_exc
    user = await db.get(User, user_id)
    if not user:
        raise creds_exc
    return user


# ── Routes ────────────────────────────────────────────────────────────────────

@router.post("/register", status_code=201)
async def register(body: RegisterBody, db: AsyncSession = Depends(get_db)):
    existing = await db.scalar(select(User).where(User.email == body.email))
    if existing:
        raise HTTPException(400, "Email already registered")
    user = User(
        email=body.email,
        hashed_password=pwd_context.hash(body.password),
        full_name=body.full_name,
        plan="free",  # Always start free — paid plans granted only via Stripe webhook
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)
    token = create_access_token({"sub": str(user.id)})
    return {"id": str(user.id), "email": user.email, "plan": user.plan,
            "access_token": token, "token_type": "bearer"}


@router.post("/login")
async def login_json(body: LoginBody, db: AsyncSession = Depends(get_db)):
    """JSON-body login (used by the Next.js frontend)."""
    user = await db.scalar(select(User).where(User.email == body.email))
    if not user or not pwd_context.verify(body.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token({"sub": str(user.id)})
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {"id": str(user.id), "email": user.email,
                 "full_name": user.full_name, "plan": user.plan},
    }


@router.post("/token")
async def login_form(form_data: OAuth2PasswordRequestForm = Depends(), db: AsyncSession = Depends(get_db)):
    """OAuth2 form-based login (used by Swagger UI / OAuth clients)."""
    user = await db.scalar(select(User).where(User.email == form_data.username))
    if not user or not pwd_context.verify(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    token = create_access_token({"sub": str(user.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me")
async def get_me(current_user: User = Depends(get_current_user)):
    return {
        "id": str(current_user.id),
        "email": current_user.email,
        "full_name": current_user.full_name,
        "plan": current_user.plan,
        "is_active": current_user.is_active,
    }
