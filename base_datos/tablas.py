from base_datos.almacen import miclaseBase
from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, DateTime, Date, Time
from sqlalchemy.orm import relationship
from datetime import datetime



class Usuarios(miclaseBase):
    
    __tablename__ = "Usuarios"
    
    id = Column(Integer, primary_key=True)
    nombre_usuario = Column(String, unique=True, nullable=False)
    email = Column(String, unique=True, nullable=False)
    contrasena_hash = Column(String, nullable=False)
    contrasena_salt = Column(String, nullable=False)
    rol = Column(String, nullable=False)  
    activo = Column(Boolean, default=True)
    token_actual = Column(String, nullable=True)
    token_expira = Column(DateTime, nullable=True)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    doctor = relationship("Doctores", back_populates="usuario", uselist=False)
    cliente = relationship("Clientes", back_populates="usuario", uselist=False)




class Doctores(miclaseBase):
    
    __tablename__ = "Doctores"
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    colegiacion = Column(String, unique=True, nullable=False)
    especialidad = Column(String, nullable=False)
    telefono = Column(String, nullable=False)
    correo = Column(String, unique=True, nullable=False)
    usuario_id = Column(Integer, ForeignKey("Usuarios.id"), nullable=True)
    estado = Column(String, default="contratado")  # "contratado" o "pendiente"
    fecha_contratacion = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    usuario = relationship("Usuarios", back_populates="doctor")
    citas = relationship("Citas", back_populates="doctor", cascade="all, delete-orphan")
    consultas = relationship("Consultas", back_populates="doctor")

class Clientes(miclaseBase):
    
    __tablename__ = "Clientes"
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String, nullable=False)
    identidad = Column(String, unique=True, nullable=False)
    telefono = Column(String, nullable=False)
    correo = Column(String, unique=True, nullable=False)
    edad = Column(Integer, nullable=False)
    usuario_id = Column(Integer, ForeignKey("Usuarios.id"), nullable=False)
    fecha_registro = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    usuario = relationship("Usuarios", back_populates="cliente")
    citas = relationship("Citas", back_populates="cliente", cascade="all, delete-orphan")
    consultas = relationship("Consultas", back_populates="cliente")




class Citas(miclaseBase):
    
    __tablename__ = "Citas"
    
    id = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey("Clientes.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("Doctores.id"), nullable=False)
    fecha = Column(Date, nullable=False)
    hora = Column(Time, nullable=False)
    motivo = Column(String, nullable=False)
    estado = Column(String, default="pendiente")  
    
    # Relaciones
    cliente = relationship("Clientes", back_populates="citas")
    doctor = relationship("Doctores", back_populates="citas")
    consulta = relationship("Consultas", back_populates="cita", uselist=False, cascade="all, delete-orphan")




class Consultas(miclaseBase):
    
    __tablename__ = "Consultas"
    
    id = Column(Integer, primary_key=True)
    cita_id = Column(Integer, ForeignKey("Citas.id"), unique=True, nullable=False)
    cliente_id = Column(Integer, ForeignKey("Clientes.id"), nullable=False)
    doctor_id = Column(Integer, ForeignKey("Doctores.id"), nullable=False)
    diagnostico = Column(String, nullable=False)
    tratamiento = Column(String, nullable=False)
    notas = Column(String, nullable=True)
    fecha_consulta = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    cita = relationship("Citas", back_populates="consulta")
    cliente = relationship("Clientes", back_populates="consultas")
    doctor = relationship("Doctores", back_populates="consultas")
    recetas = relationship("Recetas", back_populates="consulta", cascade="all, delete-orphan")


class Medicamentos(miclaseBase):
    
    __tablename__ = "Medicamentos"
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String, unique=True, nullable=False)
    presentacion = Column(String, nullable=False)
    stock = Column(Integer, default=0, nullable=False)
    fecha_creacion = Column(DateTime, default=datetime.utcnow)
    
    # Relaciones
    recetas = relationship("Recetas", back_populates="medicamento")



class Recetas(miclaseBase):
    
    __tablename__ = "Recetas"
    
    id = Column(Integer, primary_key=True)
    consulta_id = Column(Integer, ForeignKey("Consultas.id"), nullable=False)
    medicamento_id = Column(Integer, ForeignKey("Medicamentos.id"), nullable=False)
    dosis = Column(String, nullable=False)
    cantidad = Column(Integer, nullable=False)
    indicaciones = Column(String, nullable=True)
    
    # Relaciones
    consulta = relationship("Consultas", back_populates="recetas")
    medicamento = relationship("Medicamentos", back_populates="recetas")