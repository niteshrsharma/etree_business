import os
import uuid
import mimetypes
import aiofiles
import asyncio

async def save_media(data: bytes, mime_type: str = None) -> str:
    try:
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        media_dir = os.path.join(base_dir, 'Media')
        await asyncio.to_thread(os.makedirs, media_dir, exist_ok=True)


        file_guid = str(uuid.uuid4())
        extension = mimetypes.guess_extension(mime_type)
        if not extension:
            extension = '.bin'

        filename = f"{file_guid}{extension}"
        file_path = os.path.join(media_dir, filename)

        # Async write
        async with aiofiles.open(file_path, 'wb') as f:
            await f.write(data)

        return f"/media/{filename}"

    except Exception as e:
        raise RuntimeError(f"Failed to save media: {e}")


async def del_media(media_id: str) -> bool:
    try:
        if not media_id:
            return False

        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        media_dir = os.path.join(base_dir, 'Media')
        file_path = os.path.join(media_dir, media_id)

        exists = await asyncio.to_thread(os.path.exists, file_path)
        if exists:
            await asyncio.to_thread(os.remove, file_path)
            return True
        return False

    except FileNotFoundError:
        return False
    except Exception as e:
        print(f"Failed to delete media {media_id}: {e}")
        return False
