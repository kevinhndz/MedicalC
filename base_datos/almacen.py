import os
from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

load_dotenv()

URL_UBICACION_ALMACEN = os.getenv("UBICACION_ALMACEN")

motor = create_engine(
    URL_UBICACION_ALMACEN, 
    connect_args={"check_same_thread": False}
)

llaves = sessionmaker(autocommit=False, autoflush=False, bind=motor)

class miclaseBase(DeclarativeBase):
    pass

def abrir_puerta_a_bd():
    base_datos = llaves()
    try:
        yield base_datos
    finally:
        base_datos.close()