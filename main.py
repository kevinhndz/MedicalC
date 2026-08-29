from fastapi import FastAPI
from routers.crearUsuarios import crear
from routers.Login import login
from base_datos.almacen import motor, miclaseBase

miclaseBase.metadata.create_all(bind=motor)

app = FastAPI()

app.include_router(crear.router)
app.include_router(login.router)

