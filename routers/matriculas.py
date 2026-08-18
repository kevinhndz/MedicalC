from fastapi import FastAPI, HTTPException, status, Depends, APIRouter
from sqlalchemy.orm import Session

from models.almacen import abrir_conexion_a_bd
from models.filtro_seguridad import Revisar_JSON_de_Matriculas
from models.tablas import Matriculas, Estudiantes, Asignaturas
from utils.autenticacion import permiso_admin


router = APIRouter(
    prefix="/matriculas",
    tags=["Matriculas"]
)


@router.get("/")
def ver_matriculas(
    pagina: int = 1,
    limite: int = 10,
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(permiso_admin)
):
    
    matriculas = base_datos.query(Matriculas).all()
    total = len(matriculas)
    

    inicio = (pagina - 1) * limite
    
    matriculas_paginadas = matriculas[inicio:inicio + limite]
    
   
    resultado = []
    for matricula in matriculas_paginadas:
        estudiante = base_datos.query(Estudiantes).filter(Estudiantes.id == matricula.id_est).first()
        asignatura = base_datos.query(Asignaturas).filter(Asignaturas.id == matricula.id_asig).first()
        
        resultado.append({
            "id": matricula.id,
            "id_est": matricula.id_est,
            "id_asig": matricula.id_asig,
            "nombre_estudiante": estudiante.nombre if estudiante else "No encontrado",
            "nombre_asignatura": asignatura.nombre if asignatura else "No encontrada",
            "correo_estudiante": estudiante.correo if estudiante else "N/A"
        })
    
   
    hay_mas = (inicio + limite) < total
    many = len(resultado)
    
    return {
        "Mensaje": f"Se encontraron {many} matriculas",
        "Matriculas": resultado,
        "hay_mas": hay_mas
    }

# crear matricula
@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_matricula(
    json: Revisar_JSON_de_Matriculas,
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(permiso_admin)
):
    
  
    estudiante = base_datos.query(Estudiantes).filter(Estudiantes.id == json.id_est).first()
    if estudiante is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
   
    asignatura = base_datos.query(Asignaturas).filter(Asignaturas.id == json.id_asig).first()
    if asignatura is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada"
        )
   
    check = base_datos.query(Matriculas).filter(
        Matriculas.id_est == json.id_est,
        Matriculas.id_asig == json.id_asig
    ).first()
    
    if check is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"{estudiante.nombre} ya está matriculado en {asignatura.nombre}"
        )

    nueva_matricula = Matriculas(
        id_est=json.id_est,
        id_asig=json.id_asig
    )
    
    base_datos.add(nueva_matricula)
    base_datos.commit()
    base_datos.refresh(nueva_matricula)
    
    return {
        "Mensaje": f"{estudiante.nombre} ha sido matriculado en {asignatura.nombre}",
        "id": nueva_matricula.id
    }


@router.delete("/{id}")
def borrar_matricula(
    id: int,
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(permiso_admin)
):
    
    a_borrar = base_datos.query(Matriculas).filter(Matriculas.id == id).first()
    
    if a_borrar is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matricula no existe!"
        )
    else:
      
        estudiante = base_datos.query(Estudiantes).filter(Estudiantes.id == a_borrar.id_est).first()
        asignatura = base_datos.query(Asignaturas).filter(Asignaturas.id == a_borrar.id_asig).first()
        
        base_datos.delete(a_borrar)
        base_datos.commit()
        
        return {
            "Mensaje": f"{estudiante.nombre} ha sido desmatriculado de {asignatura.nombre}"
        }


@router.put("/{id}")
def editar_matricula(
    id: int,
    json: Revisar_JSON_de_Matriculas,
    base_datos: Session = Depends(abrir_conexion_a_bd),
    usuario: dict = Depends(permiso_admin)
):
    
    find_put = base_datos.query(Matriculas).filter(Matriculas.id == id).first()
    
    if find_put is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Matricula no encontrada"
        )
    
   
    estudiante = base_datos.query(Estudiantes).filter(Estudiantes.id == json.id_est).first()
    if estudiante is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado"
        )
    
    
    asignatura = base_datos.query(Asignaturas).filter(Asignaturas.id == json.id_asig).first()
    if asignatura is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignatura no encontrada"
        )
    

    check = base_datos.query(Matriculas).filter(
        Matriculas.id_est == json.id_est,
        Matriculas.id_asig == json.id_asig,
        Matriculas.id != id  
    ).first()
    
    if check is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Este estudiante ya está matriculado en esa asignatura"
        )
    
    find_put.id_est = json.id_est
    find_put.id_asig = json.id_asig
    
    base_datos.add(find_put)
    base_datos.commit()
    base_datos.refresh(find_put)
    
    return {
        "Mensaje": f"Matricula actualizada correctamente",
        "id": find_put.id
    }