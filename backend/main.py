from fastapi import FastAPI
from backend.config import settings, database
from backend.Controllers import AuthController, RoleController, RequiredFieldsForUsersController
import uvicorn
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, HTMLResponse
from contextlib import asynccontextmanager
from starlette.middleware.cors import CORSMiddleware

@asynccontextmanager
async def lifespan(app: FastAPI):
    await database.connect()
    yield
    await database.disconnect()

app = FastAPI(title="ETREE", lifespan=lifespan)


allowed_origins = (
    [str(origin).rstrip('/') for origin in settings.ALLOWED_ORIGINS_FOR_DEV]
    if settings.IS_DEVMODE
    else [str(origin).rstrip('/') for origin in settings.ALLOWED_ORIGINS_FOR_PROD]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)

# api routes
app.include_router(AuthController.router, prefix="/api/auth", tags=["auth"])
app.include_router(RoleController.router, prefix="/api/roles", tags=["roles"])
app.include_router(RequiredFieldsForUsersController.router, prefix='/api/user-required-fields', tags=["required fields for users"])
# static file routes
app.mount("/media", StaticFiles(directory="backend/Media"), name="media")
app.mount("/assets", StaticFiles(directory="backend/Public/assets"), name="frontend")

@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_spa(full_path: str):
    if full_path.startswith("api") or full_path.startswith("media"):
        return {"detail": "Not Found"}
    return FileResponse("backend/Public/index.html")


if __name__ == "__main__":
    uvicorn.run("backend.main:app", host="0.0.0.0", port=settings.PORT, reload=settings.IS_DEVMODE)