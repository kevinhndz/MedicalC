import os
from dotenv import load_dotenv
from datetime import datetime, timedelta, timezone

from jose import jwt,JWTError

load_dotenv()

UBICACION_ALMACEN = os.getenv("SECRET_KEY")


def crear_boleto(user: str,user_id: int, user_rol: str ):
    
    expira_en = datetime.now(timezone.utc) + timedelta(minutes= 30)
    
    datos = {
        
        "user": user,
        "user_id": user_id,
        "user_rol": user_rol,
        "expira": expira_en 
    }
    
    boleto = jwt.encode(
        
        datos,
        UBICACION_ALMACEN,
        algorithm= "HS256"  
    )
    
    return boleto


def verificar_boleto(token: str):
    
    try:
        datos = jwt.decode(token, UBICACION_ALMACEN, algorithms=["HS256"])
        return datos
    
    except JWTError:
        return None
    
    
    