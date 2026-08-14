from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, status
from routers import estudiantes

from models.almacen import miClaseBase, motor

app = FastAPI()

miClaseBase.metadata.create_all(bind = motor)

app.include_router(estudiantes.router)