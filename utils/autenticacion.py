from fastapi import Header, HTTPException,status, Depends
from utils.boletos import verificar_boleto


def el_vigilante(token: str = Header(...)):
    
   revisar_token = verificar_boleto(token)
   
   if revisar_token is None:
       raise HTTPException(
           status_code = status.HTTP_401_UNAUTHORIZED,
           detail = "Token no valido o expirado"
       )
   else:
       return revisar_token


def permiso_doctor(json: dict = Depends(el_vigilante)):
    
    if json["rol"] != "doctor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permitido hacer esta accion!"
        )
    else:
        return json

def permiso_paciente(json: dict = Depends(el_vigilante)):
    
    if json["rol"] != "cliente":
        raise HTTPException(
            status_code = status.HTTP_403_FORBIDDEN,
            detail = "No tienes permiso"
        )
    else:
        return json
    