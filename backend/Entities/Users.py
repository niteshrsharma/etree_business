from sqlalchemy import Column, String, TIMESTAMP, ForeignKey, Boolean, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import datetime
import uuid
from backend.Entities.Base import Base

class Users(Base):
    __tablename__ = 'Users'

    Id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    FullName = Column(String(200), nullable=False)
    Email = Column(String(255), nullable=False, unique=True)
    Password = Column(String(255), nullable=False)
    RoleId = Column(Integer, ForeignKey('Roles.Id'), nullable=False)
    ProfilePicture = Column(String(255), nullable=True)
    IsActive = Column(Boolean, nullable=False, default=True)

    CreatedAt = Column(TIMESTAMP(timezone=True), default=datetime.datetime.now(datetime.UTC))
    UpdatedAt = Column(TIMESTAMP(timezone=True), default=datetime.datetime.now(datetime.UTC), onupdate=datetime.datetime.now(datetime.UTC))

    Role = relationship("Roles", backref="Users")
    fields_data = relationship(
        "UsersFieldData",
        back_populates="user",
        cascade="all, delete-orphan"
    )
