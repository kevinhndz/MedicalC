#importando info del .env
import os
from dotenv import load_dotenv

#importando librerias para abrir la conexion a la bd, cada vez que se haga una peticion HTTP
from sqlalchemy.orm import sessionmaker, DeclarativeBase
from sqlalchemy import create_engine

load_dotenv()

UBICACION_ALMACEN = os.getenv("UBICACION_ALMACEN")
motor = create_engine(UBICACION_ALMACEN)
llaves = sessionmaker(motor)

class miClaseBase(DeclarativeBase):
    pass

def abrir_conexion_a_bd():
    
    try:
        base_datos = llaves()
        yield base_datos
    finally:
        base_datos.close()




