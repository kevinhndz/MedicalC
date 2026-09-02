FROM python:3.12-slim
#esta imagen le dice a docker: busca un Sistema OS (linux) que ya tenga instalado python 3.11


WORKDIR /app 
#Crea una carpeta llamada /app dentro del contenedor y se "mete" en ella. 
#Todos los comandos que sigan se ejecutaran dentro de esta carpeta.

COPY requirements.txt .
#Copia el archivo requirements.txt del proyecto hacia el contenedor 
#el punto . significa: "la carpeta actual del contenedor, o sea /app

RUN pip install --no-cache-dir -r requirements.txt
#Ejecuta el comando para instalar todas las librerias o dependencias listadas en ese archivo.

COPY . .
#copia el resto del codigo, endpoints, auth, FrontEnd etc....

EXPOSE 8000
#Le avisa a Docker: "la aplicacion que corre local  escucha peticiones en el puerto 8000". 
#No abre el puerto al mundo exterior por si solo, solo informa.

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
# el comando final que mantiene vivo el contenedor, el equivalente a hacer uvicorn main:app --reload



#Es literalmente la receta paso a paso. No pesa nada y solo tiene instrucciones escritas:

# 1. Toma Linux con Python.
#2. Crea la carpeta /app.
#3. Instala los requerimientos.
#4. Enciende la app."

# Dockerfile no ejecuta la aplicacion todavia, solo dice como se debe preparar.

