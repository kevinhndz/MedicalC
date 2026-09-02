# Guia de Despliegue con Docker y Docker Compose

Aqui te explico como levantar cualquier aplicacion en un servidor usando Docker.

Primero,se necesita tener un servidor ya creado (Droplet , Maquina Virtual), acceso por SSH listo.Se puede comprar un servidor,
por medio de Digital Ocean que es el que use, AWS, Microsoft GCP.

---

## Paso 1: En VS CODE local 

### Crear el archivo Dockerfile

En la raiz del proyecto, se tiee que crear un archivo que se llame exactamente `Dockerfile` sin extension. Es basicamente una receta que le dice a Docker como armar la aplicacion.

Por ejemplo en Python, ire exactamnete este template.

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
EXPOSE 8000
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

Que hace esto? Basicamente:
- Descarga Python 3.11
- Crea una carpeta `/app` adentro del contenedor
- Copia el archivo de dependencias
- Instala todo lo que necesita la app
- Copia el codigo, HTML, CSS ,JS, ETC...
- Abre el puerto 8000
- Y cuando inicia el contenedor, ejecuta la app

Si se usa Node o Go por ejemplo o cualquier lenguaje, se cambia el `FROM` al principio y el ultimo comando, pero la idea es la misma.

### Crear el archivo docker-compose.yml

Ahora se crea otro archivo en la raiz, este se llama `docker-compose.yml`. Este archivo es como el director de orquesta que coordina todo:

```yaml
services:
  mi-servicio:
    build: .
    container_name: mi-contenedor-app
    restart: always
    ports:
      - "8000:8000"
    env_file:
      - .env
```

Que significa cada cosa:
- `build: .` le dice que use el Dockerfile de la carpeta actual
- `container_name` es el nombre que va a tener el contenedor
- `restart: always` si la app se cae, se reinicia automaticamente
- `ports` mapea el puerto del servidor al puerto de la app
- `env_file` carga las variables secretas desde un archivo `.env`

### Subir a GitHub

Commits y push normales:

```bash
git add .
git commit -m "agrego configuracion de docker"
git push origin main
```

---

## Paso 2: En el Servidor

### Clonar el repositorio

Nos conectamos por SSH al servidor y clonamos el proyecto:

```bash
ssh root@nombre-del-servidor
cd /app
git clone https://github.com/tu-usuario/mi-repositorio.git .
cd mi-repositorio
```

### Crear el archivo .env

Creo un archivo `.env` en el servidor con las variables secretas reales de produccion:

```bash
nano .env
```

Pegas las variables, guarda con `Ctrl+O`, Enter, y salis con `Ctrl+X`.

### El comando que hace la magia

Dentro de la carpeta del proyecto, ejecuta:

```bash
docker compose up -d --build
```

Listo. Eso es todo. La aplicacion ya esta en linea.

---

## Que pasa por atras cuando se ejecuta ese comando

 cuando ejecuta `docker compose up -d --build`, pasan varias cosas muy rapido:

**1. Docker Compose lee el archivo yml**
Lee el `docker-compose.yml` y ve la linea `build: .`.  y dice: "Ok, necesito armar una imagen primero".

**2. Se arma la imagen**
Ejecuta el Dockerfile paso a paso. Lo que hace es:
- Descarga la imagen base (Linux + Python en este caso) - Capa 1
- Copia tus dependencias  - Capa 2
- Instala todo con pip - Capa 3
- Copia tu codigo fuente - Capa 4
- Todo esto se apila en capas en el disco duro - La ultima capa es el contenedor es invisible.

El resultado es una imagen Docker. Es como una fotografia congelada de la app lista para ejecutarse.

**3. Se crean y inyectan las reglas**
Docker Compose toma esa imagen y le dice: "escucha, el puerto 8000 del servidor mapea al puerto 8000 del contenedor, y aca van las variables secretas del `.env`". Y con eso esa imagen se introduce en un contenedor.

**4. Nace el contenedor**
Se prende la aplicacion en la memoria RAM. la app esta viva y corriendo.

**5. Va al fondo con -d**
El flag `-d` significa que corre en background. cuando se cierra la terminal SSH la app sigue viva, seguira en linea mientras el servidor este encendido.

---

## Algunos comandos utiles para cuando ya esta corriendo

Ver los contenedores que estan vivos:

```bash
docker ps
```

Ver los logs de la app (para ver si hay errores):

```bash
docker logs -f mi-contenedor-app
```

Detener el contenedor:

```bash
docker compose down
```

Reiniciar sin rebuildar:

```bash
docker compose up -d
```

---

## Resumen
