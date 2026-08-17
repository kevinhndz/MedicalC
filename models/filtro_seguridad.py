from pydantic import BaseModel, Field, EmailStr
from models.almacen import miClaseBase


class Revisar_JSON_de_Estudiantes(BaseModel):
    nombre: str = Field(min_length=3, max_length=50)
    telefono: str = Field(min_length=8, max_length=20)
    correo: EmailStr


class Revisar_JSON_de_Asignaturas(BaseModel):
    nombre: str = Field(min_length=3, max_length=50)
    creditos: int
    seccion: str
    dia: str = Field(min_length=3, max_length=20)
    horario: str


class Revisar_JSON_de_Nuevo_Empleado(BaseModel):
    nombre: str = Field(min_length=3, max_length=50)
    telefono: str = Field(min_length=8, max_length=20)
    correo: EmailStr
    cargo: str = Field(min_length=3, max_length=30)
    
    user: str = Field(min_length=3, max_length=30)
    password: str = Field(min_length=4, max_length=50)


class RevisarLogin(BaseModel):
    
    user: str = Field(min_length=5, max_length=20)
    password: str = Field(min_length=6, max_length=30)


class Revisar_JSON_de_Matriculas(BaseModel):
    id_est: int
    id_asig: int