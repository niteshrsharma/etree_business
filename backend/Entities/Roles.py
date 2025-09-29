from sqlalchemy import Column, Text, TIMESTAMP
from sqlalchemy import Integer
import datetime
from backend.Entities.Base import Base

class Roles(Base):
    __tablename__ = 'Roles'

    Id = Column(Integer, primary_key=True, autoincrement=True)
    Name = Column(Text, nullable=False, unique=True)
    Description = Column(Text, nullable=True)
    CreatedAt = Column(TIMESTAMP(timezone=True), default=datetime.datetime.utcnow)
    UpdatedAt = Column(TIMESTAMP(timezone=True), default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)
