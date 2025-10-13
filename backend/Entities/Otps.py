from sqlalchemy import Column, String, Boolean, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import datetime
import uuid
from backend.Entities.Base import Base

class Otps(Base):
    __tablename__ = "Otps"

    Id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    UserId = Column(UUID(as_uuid=True), ForeignKey("Users.Id", ondelete="CASCADE"), nullable=False)
    Code = Column(String(10), nullable=False)
    IsUsed = Column(Boolean, nullable=False, default=False)
    ExpiresAt = Column(TIMESTAMP(timezone=True), nullable=False)
    CreatedAt = Column(TIMESTAMP(timezone=True), default=datetime.datetime.now(datetime.UTC), nullable=False)

    # Relationship to user
    User = relationship("Users", backref="Otps")
