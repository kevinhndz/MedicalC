from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
import google.auth.transport.requests
from google.oauth2 import id_token

from base_datos.almacen import abrir_puerta_a_bd
from base_datos.tablas import Clientes, Doctores
from utils.jwt_handler import crear_token

# =====================================================================
# Google OAuth Configuration
# =====================================================================

# Este es tu Client ID de Google (el que copiaste de Google Cloud Console)
GOOGLE_CLIENT_ID = "280594607095-8c0aus4sujv45eha2d216vrfmnbde1sm.apps.googleusercontent.com"

router = APIRouter(
    prefix="/login",
    tags=["Auth"]
)

# =====================================================================
# Endpoint para login con Google
# =====================================================================

@router.post("/google")
def login_google(
    body: dict,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    """
    Recibe el token de Google del frontend, lo verifica, y si es válido,
    busca al usuario en la base de datos y lo loguea.
    """
    
    # Extraer el token que envió el frontend
    id_token_str = body.get("id_token")
    
    # Verificar que el token fue enviado
    if not id_token_str:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="id_token requerido"
        )
    
    try:
        # Verificar que el token es REAL y viene de Google
        # (no es un token falso que alguien inventó)
        request = google.auth.transport.requests.Request()
        idinfo = id_token.verify_oauth2_token(id_token_str, request, GOOGLE_CLIENT_ID)
        
        # Extraer el correo y nombre del usuario desde el token
        email = idinfo.get("email")
        nombre = idinfo.get("name")
        
        # Si no hay correo, algo está mal
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No se pudo obtener el correo de Google"
            )
        
        # BUSCAR: ¿Existe este correo en nuestra base de datos?
        # Primero buscamos en tabla de Clientes (pacientes)
        cliente = base_datos.query(Clientes).filter(Clientes.correo == email).first()
        
        # Si no está en Clientes, buscamos en tabla de Doctores
        doctor = base_datos.query(Doctores).filter(Doctores.correo == email).first()
        
        # Si encontramos el correo en Clientes, lo logueamos como cliente
        if cliente:
            # Crear un token JWT (papel de acceso) para el usuario
            token = crear_token({"sub": cliente.user, "rol": "cliente"})
            return {
                "token": token,
                "user": cliente.user,
                "rol": "cliente"
            }
        
        # Si encontramos el correo en Doctores, lo logueamos como doctor
        elif doctor:
            # Crear un token JWT (papel de acceso) para el usuario
            token = crear_token({"sub": doctor.user, "rol": "doctor"})
            return {
                "token": token,
                "user": doctor.user,
                "rol": "doctor"
            }
        
        # Si el correo NO existe en la base de datos
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario con correo {email} no registrado. Por favor, crea una cuenta primero."
            )
    
    # Si el token de Google es inválido o falso
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google invalido o expirado"
        )