from fastapi import FastAPI, HTTPException, status, Depends, APIRouter, Header
from sqlalchemy.orm import Session

from models.almacen import motor, miClaseBase, abrir_conexion_a_bd
from models.filtro_seguridad import Revisar_JSON_de_Estudiantes
from models.tablas import Estudiantes



router = APIRouter (
    prefix = "/estudiantes",
    tags = ["Estudiantes"]
    
)

@router.get("/")
def ver_estudiantes(base_datos: Session = Depends(abrir_conexion_a_bd)):
    
   check = base_datos.query(Estudiantes).all()
   many = 0
   
   if not check:
       raise HTTPException(
           status_code= status.HTTP_404_NOT_FOUND,
           detail = "No hay estudiantes registrados aun!"
       )
   else:
      for student in check:
          many+=1
        
      return {"Mensaje": f"Se encontraron {many} estudiantes", "Estudiantes": check}
    


@router.post("/", status_code= status.HTTP_201_CREATED)
def crear_estudiante(
    json:Revisar_JSON_de_Estudiantes,
    base_datos: Session = Depends(abrir_conexion_a_bd)
    ):
    
    check = base_datos.query(Estudiantes).filter(Estudiantes.correo == json.correo).first()
    
    if check is None:
        
        nuevos_datos = Estudiantes(
            
             nombre = json.nombre,
             telefono = json.telefono,
             correo = json.correo
             
        )
        base_datos.add(nuevos_datos)
        base_datos.commit()
        base_datos.refresh(nuevos_datos)
        return {"Mensaje": f"Se anadio al estudiante: {json.nombre}!"}
    else:
        raise HTTPException(
            status_code = status.HTTP_409_CONFLICT,
            detail = f"{json.nombre} ya fue registrado, intenta de nuevo"
            
        )

        
    
       
   

    