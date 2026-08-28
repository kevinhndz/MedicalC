from fastapi import FastAPI, HTTPException, status, APIRouter, Depends
from sqlalchemy.orm import Session

from base_datos.almacen import abrir_puerta_a_bd
from base_datos.seguridad import Revisar_JSON_Crear_Cliente, Revisar_JSON_Crear_Doctor
from base_datos.tablas import Clientes, Doctores, Usuarios

router = APIRouter(
    prefix="/crear",
    tags=["Crear"]
)

@router.post("/nuevo_cliente", status_code=status.HTTP_201_CREATED)
def crear_nuevo_cliente(json: Revisar_JSON_Crear_Cliente, base_datos: Session = Depends(abrir_puerta_a_bd)):
    check = base_datos.query(Clientes).filter(Clientes.identidad == json.identidad).first() 
    
    if check is None:
        nuevo_usuario = Usuarios(
            user=json.user,
            password=json.password,
            rol=json.rol
        )
        base_datos.add(nuevo_usuario)
        base_datos.flush()  

        nuevo_customer = Clientes(
            nombre=json.nombre,
            telefono=json.telefono,
            correo=json.correo,
            identidad=json.identidad,
            edad=json.edad,
            id_usuario=nuevo_usuario.id
        )
        base_datos.add(nuevo_customer)
        
        
        base_datos.commit()
        base_datos.refresh(nuevo_customer)
        
        return nuevo_customer
    else:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cliente ya existe"
        )

@router.post("/nuevo_doctor", status_code=status.HTTP_201_CREATED)   
def crear_nuevo_doctor(json: Revisar_JSON_Crear_Doctor, base_datos: Session = Depends(abrir_puerta_a_bd)):
    check = base_datos.query(Doctores).filter(Doctores.no_colegiacion == json.no_colegiacion).first() 
    
    if check is None:
        nuevo_usuario = Usuarios(
            user=json.user,
            password=json.password,
            rol=json.rol
        )
        base_datos.add(nuevo_usuario)
        base_datos.flush()  

        nuevo_doctor = Doctores(
            nombre=json.nombre,
            no_colegiacion=json.no_colegiacion,
            especialidad=json.especialidad,
            telefono=json.telefono,
            correo=json.correo,
            id_usuario=nuevo_usuario.id
        )
        base_datos.add(nuevo_doctor)
        
    
        base_datos.commit()
        base_datos.refresh(nuevo_doctor)
        
        return nuevo_doctor
    else:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Doctor ya existe"
        )
    


