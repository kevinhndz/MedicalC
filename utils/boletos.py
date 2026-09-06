import os
from datetime import datetime, timedelta, timezone
from dotenv import load_dotenv
from fastapi import HTTPException, status
from jose import JWTError, jwt

load_dotenv()

LLAVE_SECRETA = os.getenv("SECRET_KEY")


# Funcion #1 - Crear el Token (aka boleto)

def crear_boleto(user: str, user_id: int, rol: str):
   
    expira_en = datetime.now(timezone.utc) + timedelta(minutes=30)
    
    datos = {
        "user": user,
        "user_id": user_id,
        "rol": rol,
        "exp": expira_en
    }
    
    boleto = jwt.encode(
        datos,
        LLAVE_SECRETA,
        algorithm="HS256"
    )
    
    return boleto


# Funcion #2 - Verificar el Token
def verificar_boleto(token: str):
    try:
        
        boleto = jwt.decode(
            token,
            LLAVE_SECRETA,
            algorithms=["HS256"]
        )
        return boleto
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Sesion invalida o expirada"
        )
    