from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware

from routers.crearUsuarios import crear
from routers.endpoints import pacientes, med, citas, consultas, doctores, recetas
from routers.Login import login
from base_datos.almacen import motor, miclaseBase

miclaseBase.metadata.create_all(bind=motor)

app = FastAPI(
    title="API Sistema de una Clinica",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 1. PRIMERO van tus rutas de API
app.include_router(crear.router)
app.include_router(login.router)
app.include_router(pacientes.router)
app.include_router(med.router)
app.include_router(citas.router)          
app.include_router(consultas.router)     
app.include_router(doctores.router)      
app.include_router(recetas.router)       

app.mount("/", StaticFiles(directory="Frontend", html=True), name="Frontend")