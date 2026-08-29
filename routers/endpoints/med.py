from fastapi import FastAPI, HTTPException, status, Depends, APIRouter, Query
from sqlalchemy.orm import Session

from base_datos.almacen import abrir_puerta_a_bd
from base_datos.seguridad import Revisar_JSON_Medicamento, Revisar_JSON_Update_Medicamento
from base_datos.tablas import Medicamentos
from utils.autenticacion import permiso_doctor


router = APIRouter(
    
    prefix = "/medicamentos",
    tags = ["Medicamentos"],
    dependencies = [Depends(permiso_doctor)]
)

@router.get("/")
def ver_medicamentos(
    base_datos: Session = Depends(abrir_puerta_a_bd),
    limite: int = Query(10, ge=1, le=100), 
    salto: int = Query(0, ge=0)
):
    check = base_datos.query(Medicamentos).offset(salto).limit(limite).all()
    
    if not check:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "No hay medicamentos registrados"
        )
    else:
        return check



@router.post("/")
def crear_nuevo_med(
    
    json: Revisar_JSON_Medicamento,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    
    check = base_datos.query(Medicamentos).filter(Medicamentos.nombre == json.nombre).first()
    
    if check is not None:
        raise HTTPException(
            status_code = status.HTTP_409_CONFLICT,
            detail = "El medicamente ya existe, intenta de nuevo"
        )
    else:
        
        nuevo_med = Medicamentos(
             nombre = json.nombre,
             presentacion = json.presentacion,
             stock = json.stock
            
        )
        base_datos.add(nuevo_med)
        base_datos.commit()
        base_datos.refresh(nuevo_med)
        return {
            "id": nuevo_med.id,
            "nombre": nuevo_med.nombre
        }
        

@router.patch("/{medicamento_id}")
def actualizar_medicamento(
    medicamento_id: int,
    json: Revisar_JSON_Update_Medicamento,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
   
    med = base_datos.query(Medicamentos).filter(Medicamentos.id == medicamento_id).first()
    
   
    if med is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El medicamento con ID {medicamento_id} no existe"
        )
   
    datos_dict = json.model_dump(exclude_unset=True)
    
    
    for llave, valor in datos_dict.items():
        setattr(med, llave, valor)
    

    base_datos.commit()
    base_datos.refresh(med)
    
    return med



@router.delete("/{medicamento_id}")
def eliminar_medicamento(
    medicamento_id: int,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    
    med = base_datos.query(Medicamentos).filter(Medicamentos.id == medicamento_id).first()
    
   
    if med is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"El medicamento con ID {medicamento_id} no existe"
        )
    
    
    base_datos.delete(med)
    base_datos.commit()
    
    return {"mensaje": f"El medicamento '{med.nombre}' con ID {medicamento_id} fue eliminado correctamente"}