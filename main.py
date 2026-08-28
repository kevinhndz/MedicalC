from fastapi import FastAPI, APIRouter
from routers.crearUsuarios import crear



app = FastAPI()


@app.get("/")
def home():
    return {"testing": "API"}