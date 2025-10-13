from sqlalchemy import Column,Integer, Text, TIMESTAMP, Boolean
import datetime
from backend.Entities.Base import Base

class Roles(Base):
    __tablename__ = 'Roles'

    Id = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(Text, nullable=False, unique=True)
    Description = Column(Text, nullable=True)
    RegistrationAllowed = Column(Boolean, nullable=False, default=False)
    CreatedAt = Column(TIMESTAMP(timezone=True), default=datetime.datetime.now(datetime.UTC))
    UpdatedAt = Column(TIMESTAMP(timezone=True), default=datetime.datetime.now(datetime.UTC), onupdate=datetime.datetime.now(datetime.UTC))
 