from pydantic import BaseModel, EmailStr, Field
from typing import Optional


class Revisar_JSON_Crear_Doctor(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)
    no_colegiacion: str = Field(..., min_length=3, max_length=20)
    especialidad: str = Field(..., min_length=3, max_length=50)
    telefono: str = Field(..., min_length=8, max_length=15)
    correo: EmailStr
    user: str = Field(..., min_length=4, max_length=30, pattern="^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=6, max_length=100)
    rol: str = Field(..., min_length=3, max_length=20)


class Revisar_JSON_Crear_Cliente(BaseModel):
    nombre: str = Field(..., min_length=3, max_length=100)
    telefono: str = Field(..., min_length=8, max_length=15)
    correo: EmailStr
    edad: int = Field(..., ge=0, le=120)
    identidad: str = Field(..., min_length=5, max_length=30)
    user: str = Field(..., min_length=4, max_length=30, pattern="^[a-zA-Z0-9_-]+$")
    password: str = Field(..., min_length=6, max_length=100)
    rol: str = Field(..., min_length=3, max_length=20)
    

class Revisar_JSON_Usuario (BaseModel):
    
    user: str = Field(..., min_length=5, max_length= 15)
    password: str = Field(..., min_length=6, max_length=20)


class Revisar_JSON_Actualizar_Paciente(BaseModel):
    nombre: Optional[str] = None
    telefono: Optional[str] = None
    correo: Optional[EmailStr] = None
    identidad: Optional[str] = None
    edad: Optional[int] = None
    
class Revisar_JSON_Medicamento(BaseModel):
    
    nombre: str
    presentacion: str
    stock : int = Field(ge = 0)

class Revisar_JSON_Update_Medicamento (BaseModel):
    
    nombre: Optional[str] = None
    presentacion: Optional[str]= None
    stock : Optional[int] = None
    

class Revisar_JSON_Crear_Cita (BaseModel):
    
    identidad : str
    no_colegiacion: str
    fecha_hora : str
    motivo : str
    
class Revisar_JSON_Registrar_Consulta (BaseModel):
    id_cita : int
    diagnostico : str
    tratamiento : str
    notas : Optional[str]= None



class Revisar_JSON_Crear_Receta (BaseModel):
    id_consulta : int
    id_medicamento : int
    cantidad : int = Field(..., ge=1)
    indicaciones : Optional[str] = None