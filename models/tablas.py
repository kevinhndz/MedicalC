from models.almacen import miClaseBase
from sqlalchemy import Column, Integer, ForeignKey, String
from sqlalchemy.orm import relationship


class Empleados(miClaseBase):

    __tablename__ = "Empleados"

    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    correo = Column(String, unique=True)
    telefono = Column(String, unique=True)
    cargo = Column(String)

    usuarios = relationship("Usuarios", back_populates="empleados")


class Usuarios(miClaseBase):

    __tablename__ = "Usuarios"

    id = Column(Integer, primary_key=True)
    user = Column(String, unique=True)
    password = Column(String)
    rol = Column(String)

    id_empleado = Column(Integer, ForeignKey("Empleados.id"), unique=True)

    empleados = relationship("Empleados", back_populates="usuarios")


class Estudiantes(miClaseBase):

    __tablename__ = "Estudiantes"

    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    telefono = Column(String)
    correo = Column(String, unique=True)

    matriculas = relationship("Matriculas", back_populates="estudiantes")


class Asignaturas(miClaseBase):

    __tablename__ = "Asignaturas"

    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    creditos = Column(String)
    seccion = Column(String)
    dia = Column(String)
    horario = Column(String)

    matriculas = relationship("Matriculas", back_populates="asignaturas")


class Matriculas(miClaseBase):

    __tablename__ = "Matriculas"

    id = Column(Integer, primary_key=True)

    id_est = Column(Integer, ForeignKey("Estudiantes.id"))
    id_asig = Column(Integer, ForeignKey("Asignaturas.id"))

    estudiantes = relationship("Estudiantes", back_populates="matriculas")
    asignaturas = relationship("Asignaturas", back_populates="matriculas")