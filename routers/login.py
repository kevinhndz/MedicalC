from fastapi import FastAPI, HTTPException, status, Depends, APIRouter

from models.almacen import abrir_conexion_a_bd
from models.filtro_seguridad import RevisarLogin
from models.tablas import Usuarios

from sqlalchemy.orm import Session
from utils.boletos import crear_boleto
from utils.hash import verificar_contrasena


router = APIRouter(
    
    prefix = "/login",
    tags = ["Login"]
    
)

@router.post("/")
def login(
    
    json: RevisarLogin,
    base_datos: Session = Depends(abrir_conexion_a_bd)
):
    
    check = base_datos.query(Usuarios).filter(Usuarios.user == json.user).first()
    
    if check is None:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = f"Usuario: {json.user} no ha sido encontrado"
        )
    
    if not verificar_contrasena(json.password, check.password):
        raise HTTPException(
            status_code = status.HTTP_401_UNAUTHORIZED,
            detail = "Contrasnea Incorrecta"
        )
    
    boleto = crear_boleto(check.user, check.id, check.rol)
    
    return {
        
        "user": check.user,
        "boleto": boleto,
        "rol" : check.rol
     
    }
    
    
    
 