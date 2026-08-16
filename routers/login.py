from fastapi import FastAPI, HTTPException, status, Depends, APIRouter
from datetime import datetime, timedelta, timezone

from models.almacen import abrir_conexion_a_bd
from models.filtro_seguridad import RevisarLogin
from models.tablas import Usuarios

from sqlalchemy.orm import Session
from utils.boletos import crear_boleto
from utils.hash import verificar_contrasena


router = APIRouter(
    
    prefix="/login",
    tags=["Login"]
    
)

MAXIMO_INTENTOS = 3
MINUTOS_DE_BLOQUEO = 5

intentos_fallidos = {}


@router.post("/")
def login(
    
    json: RevisarLogin,
    base_datos: Session = Depends(abrir_conexion_a_bd)
):
    
    ahora = datetime.now(timezone.utc)
    
    registro = intentos_fallidos.get(json.user)
    
    if registro is not None:
        
        if registro["bloqueado_hasta"] is not None:
            
            if ahora < registro["bloqueado_hasta"]:
                
                segundos_restantes = (registro["bloqueado_hasta"] - ahora).total_seconds()
                minutos_restantes = int(segundos_restantes // 60) + 1
                
                raise HTTPException(
                    status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                    detail=f"Demasiados intentos fallidos. Intenta de nuevo en {minutos_restantes} minuto(s)"
                )
            else:
                
                intentos_fallidos[json.user] = {"conteo": 0, "bloqueado_hasta": None}
    
    check = base_datos.query(Usuarios).filter(Usuarios.user == json.user).first()
    
    if check is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario: {json.user} no ha sido encontrado"
        )
    
    if not verificar_contrasena(json.password, check.password):
        
        registro_actual = intentos_fallidos.get(json.user, {"conteo": 0, "bloqueado_hasta": None})
        registro_actual["conteo"] += 1
        
        if registro_actual["conteo"] >= MAXIMO_INTENTOS:
            registro_actual["bloqueado_hasta"] = ahora + timedelta(minutes=MINUTOS_DE_BLOQUEO)
            intentos_fallidos[json.user] = registro_actual
            
            raise HTTPException(
                status_code=status.HTTP_429_TOO_MANY_REQUESTS,
                detail=f"Superaste el limite de intentos. Tu cuenta se bloqueo por {MINUTOS_DE_BLOQUEO} minutos"
            )
        
        intentos_fallidos[json.user] = registro_actual
        intentos_restantes = MAXIMO_INTENTOS - registro_actual["conteo"]
        
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Contrasena Incorrecta. Te quedan {intentos_restantes} intento(s)"
        )
    
    intentos_fallidos[json.user] = {"conteo": 0, "bloqueado_hasta": None}
    
    boleto = crear_boleto(check.user, check.id, check.rol)
    
    return {
        
        "user": check.user,
        "boleto": boleto,
        "rol": check.rol
     
    }