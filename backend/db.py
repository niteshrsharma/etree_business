from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.config import settings

# Use async engine (note: DATABASE_URL must be async, e.g. "postgresql+asyncpg://user:pass@host/db")
engine = create_async_engine(settings.DATABASE_URL, echo=True, future=True)

# Create async session factory
async_session = async_sessionmaker(
    bind=engine,
    expire_on_commit=False,
    class_=AsyncSession,
    autoflush=False,
    autocommit=False
)
