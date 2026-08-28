from pydantic import BaseModel, EmailStr, Field


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