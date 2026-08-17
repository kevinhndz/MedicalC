from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, status, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from routers import estudiantes, registrar, asignaturas, login, matriculas
from models.almacen import miClaseBase, motor

app = FastAPI()


miClaseBase.metadata.create_all(bind=motor)

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")


@app.get("/")
def mostrar_login(request: Request):
    return templates.TemplateResponse(request, 'login.html')


@app.get("/signup")
def mostrar_registrarse(request: Request):
    return templates.TemplateResponse(request, 'signUp.html')


@app.get("/general")
def general(request: Request):
    return templates.TemplateResponse(request, 'general.html')


app.include_router(login.router)
app.include_router(estudiantes.router)
app.include_router(registrar.router)
app.include_router(asignaturas.router)
app.include_router(matriculas.router)