from sqlalchemy import Column, String, Integer, Text, TIMESTAMP
import datetime
from sqlalchemy.orm import relationship
from backend.Entities.Base import Base


class Permissions(Base):
    __tablename__ = 'Permissions'

    Id = Column(Integer, primary_key=True, autoincrement=True)
    TableName = Column(String(100), nullable=False)
    Method = Column(String(20), nullable=False)
    Description = Column(Text, nullable=True)

    CreatedAt = Column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now(datetime.UTC)
    )
    UpdatedAt = Column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now(datetime.UTC),
        onupdate=datetime.datetime.now(datetime.UTC)
    )

    RolePermissions = relationship("RolePermissions", back_populates="Permission")
