from sqlalchemy import Column, ForeignKey, Integer, String
from base_datos.almacen import miclaseBase


class Clientes(miclaseBase):
    __tablename__ = "Clientes"
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    telefono = Column(String)
    correo = Column(String, unique=True)
    identidad = Column(String, unique=True)
    edad = Column(Integer)
    id_usuario = Column(Integer, ForeignKey("Usuarios.id"))


class Doctores(miclaseBase):
    __tablename__ = "Doctores"  
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    no_colegiacion = Column(String, unique=True)
    especialidad = Column(String)
    telefono = Column(String)
    correo = Column(String, unique=True)
    id_usuario = Column(Integer, ForeignKey("Usuarios.id"))


class Usuarios(miclaseBase):
    __tablename__ = "Usuarios"  
    
    id = Column(Integer, primary_key=True)
    user = Column(String, unique=True, nullable=False) 
    password = Column(String, nullable=False)
    rol = Column(String, nullable=False)
    