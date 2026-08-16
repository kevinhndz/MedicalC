from fastapi import APIRouter, Depends, FastAPI, Header, HTTPException, status, Request
from fastapi.templating import Jinja2Templates
from fastapi.staticfiles import StaticFiles

from routers import estudiantes, registrar  
from models.almacen import miClaseBase, motor

app = FastAPI()


miClaseBase.metadata.create_all(bind=motor)

#  Montar la carpeta de archivos estaticos (JS, CSS, Imagenes)
app.mount("/static", StaticFiles(directory="static"), name="static")

#  Configurar la carpeta de las plantillas HTML
templates = Jinja2Templates(directory="templates")


@app.get("/")
def login(request: Request):
    return templates.TemplateResponse(request, 'login.html')


@app.get("/signup")
def mostrar_registrasre(request: Request):
    return templates.TemplateResponse(request,'signUp.html')

@app.get("/general")
def general(request: Request):
    return templates.TemplateResponse(request, 'general.html')



app.include_router(estudiantes.router)
app.include_router(registrar.router) 