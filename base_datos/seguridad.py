from pydantic import BaseModel, EmailStr,Field
from typing import Optional


class Revisar_JSON_Crear_Doctor(BaseModel):
    
    nombre: str 
    no_colegiacion: str
    especialidad: str
    telefono: str
    correo: EmailStr
    user: str
    password: str
    

class Revisar_JSON_Crear_Cliente(BaseModel):
    
    nombre: str 
    telefono: str
    correo: EmailStr
    edad: int
    identidad: str
    user: str
    password: str

