from fastapi import FastAPI, HTTPException, status, Depends, APIRouter, Query
from sqlalchemy.orm import Session

from base_datos.almacen import abrir_puerta_a_bd
from base_datos.tablas import Citas, Clientes, Doctores
from base_datos.seguridad import Revisar_JSON_Crear_Cita

router = APIRouter(
    prefix = "/citas",
    tags = ["Citas"]
)

@router.get("/")
def listar_citas (
    
    base_datos: Session = Depends(abrir_puerta_a_bd),
    limite: int = Query(10, ge= 1, le= 90),
    salto: int = Query(0,ge= 0 )
):
    
    check = base_datos.query(Citas).offset(salto).limit(limite).all()
    
    if not check:
        raise HTTPException(
            status_code = status.HTTP_404_NOT_FOUND,
            detail = "No hay citas por mostrar"
        )
    else:
        return check
    
@router.post("/agendar_cita")
def crear_nueva_cita(
    
    json: Revisar_JSON_Crear_Cita,
    base_datos: Session = Depends(abrir_puerta_a_bd)
):
    
    datos_paciente = base_datos.query(Clientes).filter(Clientes.identidad == json.identidad).first()
    datos_doctor = base_datos.query(Clientes).filter(Doctores.no_colegiacion == json.no_colegiacion).first()
    
    nueva_cita = Citas(
        
        id_cliente = datos_paciente.id,
        id_doctor = datos_doctor.id,
        fecha_hora = json.fecha_hora,
        motivo = json.motivo
        
    )
    base_datos.add(nueva_cita)
    base_datos.commit()
    base_datos.refresh(nueva_cita)
    return nueva_cita

