from fastapi import FastAPI, HTTPException, status, Depends, APIRouter
from sqlalchemy.orm import Session

from base_datos.almacen import abrir_puerta_a_bd
from base_datos.seguridad import Revisar_JSON_Usuario
from base_datos.tablas import Usuarios



router = APIRouter(
    
    prefix = "/login",
    tags = ["Login"]
)

@router.post("/")
def login(
    
    json: Revisar_JSON_Usuario,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    
    check = base_datos.query(Usuarios).filter(Usuarios.user == json.user).first()
    
    if check is None:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "Usuario no encontrado"
        )
    
    if check.password != json.password:
        raise HTTPException(
            status_code = status.HTTP_400_BAD_REQUEST,
            detail = "Contrasena Incorrecta"
        )
    
    return {"Mensaje": "Bienvenido"}
    