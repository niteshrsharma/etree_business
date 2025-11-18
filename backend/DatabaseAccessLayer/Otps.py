import datetime
from backend.Entities.Otps import Otps
from backend.DatabaseAccessLayer.Base import BaseDAL
from sqlalchemy import select
from uuid import UUID

class OtpsDAL(BaseDAL):
    def __init__(self):
        super().__init__(Otps)

    async def create_otp(self, user_id: UUID, code: str, expires_in_minutes: int = 10):
        expires_at = datetime.datetime.now(datetime.UTC) + datetime.timedelta(minutes=expires_in_minutes)
        otp = Otps(UserId=user_id, Code=code, ExpiresAt=expires_at)
        return await self.add(otp)  # BaseDAL helper

    async def get_valid_otp(self, user_id: str, code: str):
        """
        Fetch OTP if it exists, is not used, and not expired
        """
        now = datetime.datetime.now(datetime.UTC)
        stmt = (
            select(Otps)
            .where(
                Otps.UserId == user_id,
                Otps.Code == code,
                Otps.IsUsed.is_(False),
                Otps.ExpiresAt >= now
            )
        )
        async with self.session_scope() as session:
            result = await session.execute(stmt)
            return result.scalar_one_or_none()


    async def mark_otp_used(self, otp_id: str):
        otp = await self.get_by_id(otp_id)
        if otp:
            otp.IsUsed = True
            return await self.update(otp)  # BaseDAL helper
        return None
