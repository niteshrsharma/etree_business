from sqlalchemy import Column, Integer, ForeignKey, JSON, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID as PGUUID
from sqlalchemy.orm import relationship
from backend.Entities.Base import Base
import datetime

class UsersFieldData(Base):
    __tablename__ = "UsersFieldData"

    Id = Column(Integer, primary_key=True, autoincrement=True)
    UserId = Column(PGUUID(as_uuid=True), ForeignKey("Users.Id"), nullable=False)
    RequiredFieldId = Column(Integer, ForeignKey("RequiredFieldsForUsers.Id"), nullable=False)
    Value = Column(JSON, nullable=False)  # can store text, number, date, or selected options
    CreatedAt = Column(TIMESTAMP(timezone=True), default=datetime.datetime.now(datetime.UTC))
    UpdatedAt = Column(TIMESTAMP(timezone=True), default=datetime.datetime.now(datetime.UTC), onupdate=datetime.datetime.now(datetime.UTC))

    # optional relationships
    user = relationship("Users", back_populates="fields_data")  # assuming Users model
    required_field = relationship("RequiredFieldsForUsers", back_populates="user_values")
