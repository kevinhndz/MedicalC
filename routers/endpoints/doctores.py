from fastapi import FastAPI, HTTPException, status, Depends, APIRouter,Query
from sqlalchemy.orm import Session

from base_datos.almacen import abrir_puerta_a_bd
from base_datos.tablas import Doctores

router = APIRouter(
    prefix = "/doctores",
    tags = ["Doctores"]
    
)

@router.get("/")
def listar_doctores (
    base_datos: Session = Depends(abrir_puerta_a_bd),
    limite: int = Query(10,ge=1, le = 100),
    salto: int = Query(0, ge=0)
    
):
    
    check = base_datos.query(Doctores).offset(salto).limit(limite).all()
    
    if not check:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "No hay doctores registrados aun"
        )
    else:
        return check




