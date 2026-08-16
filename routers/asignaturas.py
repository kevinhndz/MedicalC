from fastapi import FastAPI, HTTPException, status, Depends, APIRouter
from sqlalchemy.orm import Session

from models.almacen import abrir_conexion_a_bd
from models.filtro_seguridad import Revisar_JSON_de_Asignaturas
from models.tablas import Asignaturas
from utils.autenticacion import permiso_admin


router = APIRouter(
    prefix="/asignaturas",
    tags=["Asignaturas"]
)


@router.get("/")
def ver_asignaturas(
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(permiso_admin)
):
    
    check = base_datos.query(Asignaturas).all()
    many = len(check)
    
    return {"Mensaje": f"Se encontraron {many} asignaturas", "Asignaturas": check}


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_asignatura(
    json: Revisar_JSON_de_Asignaturas,
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(permiso_admin)
):
    
    check = base_datos.query(Asignaturas).filter(Asignaturas.nombre == json.nombre).first()
    
    if check is None:
        
        nueva_asignatura = Asignaturas(
            nombre=json.nombre,
            creditos=json.creditos,
            seccion=json.seccion,
            dia=json.dia,
            horario=json.horario
        )
        base_datos.add(nueva_asignatura)
        base_datos.commit()
        base_datos.refresh(nueva_asignatura)
        return {"Mensaje": f"Se anadio la asignatura: {json.nombre}!"}
    else:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{json.nombre} ya fue registrada, intenta de nuevo"
        )


@router.delete("/{id}")
def borrar_asignatura(
    id: int,
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(permiso_admin)
):
    
    a_borrar = base_datos.query(Asignaturas).filter(Asignaturas.id == id).first()
    
    if a_borrar is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no existe!"
        )
    else:
        
        base_datos.delete(a_borrar)
        base_datos.commit()
        return {"Mensaje": f"Asignatura: {a_borrar.nombre} ha sido eliminada del sistema"}


@router.put("/{id}")
def editar_asignatura(
    id: int,
    json: Revisar_JSON_de_Asignaturas,
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(permiso_admin)
):
    
    find_put = base_datos.query(Asignaturas).filter(Asignaturas.id == id).first()
    
    if find_put is not None:
        
        find_put.nombre = json.nombre
        find_put.creditos = json.creditos
        find_put.seccion = json.seccion
        find_put.dia = json.dia
        find_put.horario = json.horario
        
        base_datos.add(find_put)
        base_datos.commit()
        base_datos.refresh(find_put)
        
        return find_put
    
    else:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada"
        )