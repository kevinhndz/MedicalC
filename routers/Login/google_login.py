import os
from dotenv import load_dotenv
from fastapi import APIRouter, HTTPException, status, Depends
from sqlalchemy.orm import Session
import google.auth.transport.requests
from google.oauth2 import id_token

from base_datos.almacen import abrir_puerta_a_bd
from base_datos.tablas import Clientes, Doctores
from utils.boletos import crear_boleto

load_dotenv()

# =====================================================================
# Google OAuth Configuration
# =====================================================================

KEY = os.getenv("GOOGLE_CLIENT_ID")


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
    Endpoint para autenticar usuarios con Google OAuth
    
    Espera:
    {
        "id_token": "token_de_google_aqui"
    }
    
    Retorna:
    {
        "token": "jwt_token",
        "user": "nombre_usuario",
        "rol": "cliente" o "doctor"
    }
    """
    
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
        idinfo = id_token.verify_oauth2_token(id_token_str, request, KEY)
        
        print(f"✅ Token de Google verificado para: {idinfo.get('email')}")
        
        # Extraer el correo y nombre del usuario desde el token
        email = idinfo.get("email")
        nombre = idinfo.get("name")
        
        # Si no hay correo, algo está mal
        if not email:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="No se pudo obtener el correo de Google"
            )
        
        print(f"🔍 Buscando usuario con correo: {email}")
        
        # BUSCAR: ¿Existe este correo en nuestra base de datos?
        # Primero buscamos en tabla de Clientes (pacientes)
        cliente = base_datos.query(Clientes).filter(Clientes.correo == email).first()
        
        # Si no está en Clientes, buscamos en tabla de Doctores
        doctor = base_datos.query(Doctores).filter(Doctores.correo == email).first()
        
        # Si encontramos el correo en Clientes, lo logueamos como cliente
        if cliente:
            print(f"✅ Cliente encontrado: {cliente.user}")
            
            # Crear un token JWT (papel de acceso) para el usuario
            token = crear_token({"sub": cliente.user, "rol": "cliente"})
            return {
                "token": token,
                "user": cliente.user,
                "rol": "cliente"
            }
        
        # Si encontramos el correo en Doctores, lo logueamos como doctor
        elif doctor:
            print(f"✅ Doctor encontrado: {doctor.user}")
            
            # Crear un token JWT (papel de acceso) para el usuario
            token = crear_boleto(cliente.user, cliente.id, "cliente")
            return {
                "token": token,
                "user": doctor.user,
                "rol": "doctor"
            }
        
        # Si el correo NO existe en la base de datos
        else:
            print(f"❌ Usuario con correo {email} no encontrado")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Usuario con correo {email} no registrado. Por favor, crea una cuenta primero."
            )
    
    # Si el token de Google es inválido o falso
    except ValueError as e:
        print(f"❌ Error de validación: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de Google invalido o expirado"
        )
    except HTTPException:
        # Re-lanzar excepciones HTTP que ya creamos
        raise
    except Exception as e:
        # Cualquier otro error inesperado
        print(f"❌ Error inesperado: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor al verificar token de Google"
        )