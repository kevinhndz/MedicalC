from sqlalchemy import Integer, String, ForeignKey, Column
from base_datos.almacen import miclaseBase


class Clientes(miclaseBase):
    
    __tablename__ = "Clientes"
    
    id = Column(Integer, primary_key= True)
    nombre = Column(String)
    telefono = Column(String)
    correo = Column(String, unique = True)
    identidad= Column(String, unique = True)
    edad = Column(Integer)
    
class Doctores (miclaseBase):
    
    id = Column(Integer, primary_key= True)
    nombre = Column(String)
    no_colegiacion = Column(String, unique = True)
    especialidad = Column(String)
    telefono = Column(String)
    correo = Column(String, unique = True)
    
    
    