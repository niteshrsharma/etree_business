from sqlalchemy import (
    Column,
    Integer,
    String,
    Boolean,
    TIMESTAMP,
    ForeignKey,
    CheckConstraint,
    JSON,
    Index
)
from sqlalchemy.orm import relationship
import datetime
from backend.Entities.Base import Base
from backend.Utils.helpers import allowed_user_field_types


class RequiredFieldsForUsers(Base):
    __tablename__ = "RequiredFieldsForUsers"

    Id = Column(Integer, primary_key=True, autoincrement=True)
    RoleId = Column(Integer, ForeignKey("Roles.Id", ondelete="CASCADE"), nullable=False)
    FieldName = Column(String(100), nullable=False)
    FieldType = Column(String(50), nullable=False)
    IsRequired = Column(Boolean, nullable=False, default=True)
    FilledByRoleId = Column(Integer, ForeignKey("Roles.Id"), nullable=False)
    EditableByRoleId = Column(Integer, ForeignKey("Roles.Id"), nullable=True)
    Options = Column(JSON, nullable=True)
    Validation = Column(JSON, nullable=True)
    DisplayOrder = Column(Integer, nullable=True)
    IsActive = Column(Boolean, nullable=False, default=True)
    CreatedAt = Column(TIMESTAMP(timezone=True), default=datetime.datetime.now(datetime.UTC))
    UpdatedAt = Column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now(datetime.UTC),
        onupdate=datetime.datetime.now(datetime.UTC)
    )

    __table_args__ = (
        CheckConstraint(
            f"FieldType IN ({', '.join(f'\'{ft}\'' for ft in allowed_user_field_types)})",
            name="check_fieldtype_valid"
        ),
        Index("idx_requiredfields_roleid", "RoleId"),
        Index("idx_requiredfields_isactive", "IsActive"),
    )

    Role = relationship("Roles", foreign_keys=[RoleId], backref="RequiredFieldsForUsers")
    FilledByRole = relationship("Roles", foreign_keys=[FilledByRoleId])
    EditableByRole = relationship("Roles", foreign_keys=[EditableByRoleId])
    user_values = relationship(
        "UsersFieldData",
        back_populates="required_field",
        cascade="all, delete-orphan"
    )

