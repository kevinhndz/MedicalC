from sqlalchemy import Column, ForeignKey, Integer, String, DateTime, Time
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
    

class Citas(miclaseBase):
    __tablename__ = "Citas"
    
    id = Column(Integer, primary_key=True)
    id_cliente = Column(Integer, ForeignKey("Clientes.id"), nullable=False)
    id_doctor = Column(Integer, ForeignKey("Doctores.id"), nullable=False)
    fecha_hora = Column(DateTime, nullable=False)
    motivo = Column(String, nullable=True)
    estado = Column(String, default="pendiente", nullable=False)
    
class Consultas(miclaseBase):
    __tablename__ = "Consultas"
    
    id = Column(Integer, primary_key=True)
    id_cita = Column(Integer, ForeignKey("Citas.id"), unique=True, nullable=False)
    diagnostico = Column(String, nullable=False)
    tratamiento = Column(String, nullable=False)
    notas = Column(String, nullable=True)


class Medicamentos (miclaseBase):
    
    __tablename__ = "Medicamentos"
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String, unique= True, nullable= False)
    presentacion = Column(String)
    stock = Column(Integer, nullable= False)
    