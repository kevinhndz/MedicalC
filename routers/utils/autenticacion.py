from fastapi import Header, HTTPException,status, Depends
from routers.utils.boletos import verificar_boleto


def el_vigilante(token: str = Header(...)):
    revisar_token = verificar_boleto(token)
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