import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
import google.auth.transport.requests
from google.oauth2 import id_token

from base_datos.almacen import abrir_puerta_a_bd
from base_datos.tablas import Clientes, Doctores, Usuarios
from routers.utils.boletos import crear_boleto

load_dotenv()

KEY = os.getenv("GOOGLE_CLIENT_ID")

if not KEY:
    raise ValueError("GOOGLE_CLIENT_ID no esta en .env")

router = APIRouter(
    prefix="/login",
    tags=["Auth"]
)

@router.post("/google")
def login_google(
    body: dict,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    
    id_token_str = body.get("id_token")
    
    if not id_token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="id_token requerido"
        )
    
    try:
        request = google.auth.transport.requests.Request()
        idinfo = id_token.verify_oauth2_token(id_token_str, request, KEY)
        
        print(f"Token de Google verificado para: {idinfo.get('email')}")
        
        email = idinfo.get("email")
        
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No se pudo obtener el correo de Google"
            )
        
        print(f"Buscando usuario con correo: {email}")
        
        cliente = base_datos.query(Clientes).filter(Clientes.correo == email).first()
        
        if cliente:
            usuario = base_datos.query(Usuarios).filter(Usuarios.id == cliente.id_usuario).first()
            
            if usuario:
                print(f"Cliente encontrado: {usuario.user}")
                token = crear_boleto(usuario.user, usuario.id, usuario.rol)
                return {
                    "token": token,
                    "user": usuario.user,
                    "rol": usuario.rol
                }
        
        doctor = base_datos.query(Doctores).filter(Doctores.correo == email).first()
        
        if doctor:
            usuario = base_datos.query(Usuarios).filter(Usuarios.id == doctor.id_usuario).first()
            
            if usuario:
                print(f"Doctor encontrado: {usuario.user}")
                token = crear_boleto(usuario.user, usuario.id, usuario.rol)
                return {
                    "token": token,
                    "user": usuario.user,
                    "rol": usuario.rol
                }
        
        print(f"Usuario con correo {email} no encontrado")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado. Crea una cuenta primero desde Crear usuario"
        )
    
    except ValueError as e:
        print(f"Error de validacion: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google invalido o expirado"
        )
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error inesperado: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor"
        )