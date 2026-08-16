from fastapi import FastAPI, Depends, Header, HTTPException, status
from utils.boletos import verificar_boleto


def el_vigilante(token: str = Header(...)):
    
    datos = verificar_boleto(token)
    
    if datos is not None:
        return datos
    else:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Boleto no valido"
        )


def permiso_admin(info_usuario: dict = Depends(el_vigilante)):
    
    if info_usuario["user_rol"] != "Administrador":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permitido hacer esta accion!"
        )
    else:
        return info_usuario


def permiso_profesor(info_usuario: dict = Depends(el_vigilante)):
    
    if info_usuario["user_rol"] != "Profesor":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permitido hacer esta accion!"
        )
    else:
        return info_usuario


def cualquier_usuario(info_usuario: dict = Depends(el_vigilante)):
    
    return info_usuario