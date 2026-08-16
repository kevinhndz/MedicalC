from fastapi import FastAPI, HTTPException, status, Depends, APIRouter, Header
from sqlalchemy.orm import Session

from models.almacen import abrir_conexion_a_bd
from models.filtro_seguridad import Revisar_JSON_de_Estudiantes
from models.tablas import Estudiantes
from utils.autenticacion import permiso_admin, cualquier_usuario


router = APIRouter(
    prefix="/estudiantes",
    tags=["Estudiantes"]
)


@router.get("/")
def ver_estudiantes(
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(cualquier_usuario)
):
    
    check = base_datos.query(Estudiantes).all()
    many = 0
    
    if not check:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No hay estudiantes registrados aun!"
        )
    else:
        for student in check:
            many += 1
        
        return {"Mensaje": f"Se encontraron {many} estudiantes", "Estudiantes": check}


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_estudiante(
    json: Revisar_JSON_de_Estudiantes,
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(cualquier_usuario)
):
    
    check = base_datos.query(Estudiantes).filter(Estudiantes.correo == json.correo).first()
    
    if check is None:
        
        nuevos_datos = Estudiantes(
            nombre=json.nombre,
            telefono=json.telefono,
            correo=json.correo
        )
        base_datos.add(nuevos_datos)
        base_datos.commit()
        base_datos.refresh(nuevos_datos)
        return {"Mensaje": f"Se anadio al estudiante: {json.nombre}!"}
    else:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{json.nombre} ya fue registrado, intenta de nuevo"
        )


@router.delete("/{id}")
def borrar_por_id(
    id: int,
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(permiso_admin)
):
    
    a_borrar = base_datos.query(Estudiantes).filter(Estudiantes.id == id).first()
    
    if a_borrar is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no existe!"
        )
    else:
        
        base_datos.delete(a_borrar)
        base_datos.commit()
        return {"Mensaje": f"Estudiante: {a_borrar.nombre} ha sido eliminado del sistema"}


@router.put("/{id}")
def editar_estudiante(
    id: int,
    json: Revisar_JSON_de_Estudiantes,
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(permiso_admin)
):
    
    find_put = base_datos.query(Estudiantes).filter(Estudiantes.id == id).first()
    
    if find_put is not None:
        
        find_put.nombre = json.nombre
        find_put.correo = json.correo
        find_put.telefono = json.telefono
        
        base_datos.add(find_put)
        base_datos.commit()
        base_datos.refresh(find_put)
        
        return find_put
    
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado"
        )