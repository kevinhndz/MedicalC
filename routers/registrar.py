from fastapi import FastAPI, Depends, HTTPException, status, APIRouter
from sqlalchemy.orm import Session

from models.almacen import abrir_conexion_a_bd
from models.filtro_seguridad import Revisar_JSON_de_Nuevo_Empleado
from models.tablas import Empleados, Usuarios
from utils.hash import hashear_contrasena

router = APIRouter(
     
    prefix="/registrar",
    tags=["Registrar"]
)


@router.post("/")
def registrar_nuevo_empleado(
    
    json: Revisar_JSON_de_Nuevo_Empleado,
    base_datos: Session = Depends(abrir_conexion_a_bd)
):
    
    contrasena_hasheada = hashear_contrasena(json.password)
    check = base_datos.query(Empleados).filter(Empleados.correo == json.correo).first()
    
    
    if check is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Error! {json.nombre} ya ha sido registrado en el sistema. Verifica tus datos de nuevo"
        )
    else:
        
        nuevo_empleado = Empleados(
            nombre=json.nombre,
            telefono=json.telefono,
            correo=json.correo,
            cargo=json.cargo
        )
        
       
        base_datos.add(nuevo_empleado)
        base_datos.commit()
        
      
        base_datos.refresh(nuevo_empleado)
        
        nuevo_usuario = Usuarios(
            user=json.user,
            password=contrasena_hasheada,
            rol=json.cargo, 
            id_empleado=nuevo_empleado.id
        )
        
        base_datos.add(nuevo_usuario)
        base_datos.commit()
        
        return {"mensaje": "Empleado y usuario registrados correctamente"}