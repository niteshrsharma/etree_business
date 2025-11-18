import os
import uuid
import mimetypes
import aiofiles
import asyncio
from typing import Tuple

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


def _get_protected_dir() -> str:
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    protected_dir = os.path.join(base_dir, "Protected_Media")
    return protected_dir

async def _ensure_protected_dir_exists() -> None:
    protected_dir = _get_protected_dir()
    await asyncio.to_thread(os.makedirs, protected_dir, exist_ok=True)

async def save_protected_file(data: bytes, mime_type: str | None = None) -> Tuple[str, int]:
   
    try:
        await _ensure_protected_dir_exists()

        file_guid = str(uuid.uuid4())
        ext = None
        if mime_type:
            ext = mimetypes.guess_extension(mime_type)
        if not ext:
            ext = ""  # no extension if unknown

        stored_filename = f"{file_guid}{ext}"
        path = os.path.join(_get_protected_dir(), stored_filename)

        async with aiofiles.open(path, "wb") as f:
            await f.write(data)

        size_bytes = await asyncio.to_thread(os.path.getsize, path)
        return stored_filename, size_bytes

    except Exception as e:
        raise RuntimeError(f"Failed to save protected file: {e}")

async def del_protected_file(stored_filename: str) -> bool:
    
    try:
        if not stored_filename:
            return False
        path = os.path.join(_get_protected_dir(), stored_filename)
        exists = await asyncio.to_thread(os.path.exists, path)
        if exists:
            await asyncio.to_thread(os.remove, path)
            return True
        return False
    except FileNotFoundError:
        return False
    except Exception as e:
        # Log or print depending on your logging setup
        print(f"Failed to delete protected file {stored_filename}: {e}")
        return False

async def read_protected_file(stored_filename: str) -> bytes:
    
    path = os.path.join(_get_protected_dir(), stored_filename)
    if not await asyncio.to_thread(os.path.exists, path):
        raise FileNotFoundError(f"Protected file '{stored_filename}' not found")
    async with aiofiles.open(path, "rb") as f:
        return await f.read()