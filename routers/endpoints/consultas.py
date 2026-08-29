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
    
    check = base_datos.query(Consultas).filter(Consultas.id_cita == json.id_cita).first()
    cita = base_datos.query(Citas).filter(Citas.id == json.id_cita).first()
    
    if check is not None:
        
        nueva_consulta = Consultas(
            
            id_cita = check.id_cita,
            diagnostico = check.diagnostico,
            tratamiento = check.tratamiento,
            notas = check.notas
            
        )
        
        base_datos.add(nueva_consulta)
        base_datos.flush()
        
        if cita is not None:
            cita.estado = "Atendida"
            
        base_datos.commit()
        base_datos.refresh(cita)
        base_datos.refresh(nueva_consulta)
        
        