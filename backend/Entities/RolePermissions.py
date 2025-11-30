from sqlalchemy import Column, Integer, ForeignKey, TIMESTAMP, PrimaryKeyConstraint
from sqlalchemy.orm import relationship
import datetime
from backend.Entities.Base import Base


class RolePermissions(Base):
    __tablename__ = 'RolePermissions'

    RoleId = Column(Integer, ForeignKey("Roles.Id", ondelete="CASCADE"), nullable=False)
    PermissionId = Column(Integer, ForeignKey("Permissions.Id", ondelete="CASCADE"), nullable=False)

    CreatedAt = Column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now(datetime.UTC)
    )
    UpdatedAt = Column(
        TIMESTAMP(timezone=True),
        default=datetime.datetime.now(datetime.UTC),
        onupdate=datetime.datetime.now(datetime.UTC)
    )

    __table_args__ = (
        PrimaryKeyConstraint("RoleId", "PermissionId"),
    )

    # Relationships
    Role = relationship("Roles", backref="RolePermissions")
    Permission = relationship("Permissions", back_populates="RolePermissions")
