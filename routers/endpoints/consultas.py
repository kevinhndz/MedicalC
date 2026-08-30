from fastapi import FastAPI, HTTPException, status, Depends, APIRouter, Query
from sqlalchemy.orm import Session

from base_datos.almacen import abrir_puerta_a_bd
from base_datos.tablas import Citas, Clientes, Doctores, Consultas
from base_datos.seguridad import Revisar_JSON_Registrar_Consulta

router = APIRouter(
    prefix = "/consulta",
    tags = ["Consultas"]
)

@router.get("/")
def ver_consultas(
    
    base_datos: Session = Depends(abrir_puerta_a_bd),
    limite: int = Query(10, ge= 1, le= 80),
    salto: int = Query(0, ge = 0)
):
    
    check = base_datos.query(Consultas).offset(salto).limit(limite).all()
    
    if not check:
        raise HTTPException(
            status_code= status.HTTP_404_NOT_FOUND,
            detail = "No hay consultas aun"
        )
    else:
        return check

@router.post("/crear_consulta")
def crear_nueva_consulta (
    
    json: Revisar_JSON_Registrar_Consulta,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    
    
    cita = base_datos.query(Citas).filter(Citas.id == json.id_cita).first()
    
    if cita is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"La cita con ID {json.id_cita} no existe"
        )
    
    
    if cita.estado != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Solo se pueden registrar consultas para citas pendientes. Estado actual: {cita.estado}"
        )
    
    
    check = base_datos.query(Consultas).filter(Consultas.id_cita == json.id_cita).first()
    
    if check is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una consulta registrada para esta cita"
        )
    
    
    nueva_consulta = Consultas(
        id_cita = json.id_cita,
        diagnostico = json.diagnostico,
        tratamiento = json.tratamiento,
        notas = json.notas
    )
    
    base_datos.add(nueva_consulta)
    base_datos.flush()
    

    cita.estado = "Atendida"
    
    base_datos.commit()
    base_datos.refresh(cita)
    base_datos.refresh(nueva_consulta)
    
    return {
        "mensaje": "Consulta registrada exitosamente",
        "consulta_id": nueva_consulta.id,
        "cita_id": nueva_consulta.id_cita,
        "cita_estado": cita.estado
    }