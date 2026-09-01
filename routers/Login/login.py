from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from base_datos.almacen import abrir_puerta_a_bd
from base_datos.seguridad import Revisar_JSON_Usuario
from base_datos.tablas import Usuarios
from utils.boletos import crear_boleto
from utils.hash import verificar_contrasena  

router = APIRouter(
    tags=["Login"]
)

#AQUI RECIBIMOS UN JSON
@router.post("/login")
def login(
    json: Revisar_JSON_Usuario,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    check = base_datos.query(Usuarios).filter(Usuarios.user == json.user).first()
    
    if check is None or not verificar_contrasena(json.password, check.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos"
        )
        
    boleto = crear_boleto(check.user, check.id, check.rol)
    
    return {
        "user": check.user,
        "rol": check.rol,
        "token": boleto 
    }