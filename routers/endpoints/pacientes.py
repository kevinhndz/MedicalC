from fastapi import FastAPI, HTTPException, status, Depends, APIRouter, Query
from sqlalchemy.orm import Session
from base_datos.almacen import abrir_puerta_a_bd

from base_datos.seguridad import Revisar_JSON_Actualizar_Paciente
from base_datos.tablas import Clientes

router = APIRouter(
    prefix="/pacientes",
    tags=["Pacientes"]
)

@router.get("/")
def ver_pacientes(
    base_datos: Session = Depends(abrir_puerta_a_bd),
    limite: int = Query(10, ge=1, le=100), 
    salto: int = Query(0, ge=0)
):
    check = base_datos.query(Clientes).offset(salto).limit(limite).all()
    
    if not check:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay pacientes registrados!"
        )
    else:
        return check
    
    

@router.patch("/{paciente_id}")
def actualizar_paciente(
    paciente_id: int,
    json: Revisar_JSON_Actualizar_Paciente,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    
    paciente = base_datos.query(Clientes).filter(Clientes.id == paciente_id).first()
    
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontro el paciente con ID {paciente_id}"
        )
    
   
    datos_dict = json.model_dump(exclude_unset=True)
    
   
    for llave, valor in datos_dict.items():
        setattr(paciente, llave, valor)
    
    base_datos.commit()
    base_datos.refresh(paciente)
    
    return paciente



@router.delete("/{paciente_id}", status_code=status.HTTP_204_NO_CONTENT)
def eliminar_paciente(
    paciente_id: int,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
  
    paciente = base_datos.query(Clientes).filter(Clientes.id == paciente_id).first()
    
   
    if not paciente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"No se encontro el paciente con ID {paciente_id}"
        )
    

    base_datos.delete(paciente)
    base_datos.commit()

    return None