# Sistema de Gestion Educativa

Un sistema web completo para administrar estudiantes, asignaturas y matriculas. Tiene una API REST protegida con login y un frontend interactivo.

## Que tiene

- Autenticacion con usuario y contrasena
- Roles de usuario (Profesor y Administrador)
- API REST segura con tokens JWT
- Gestion de estudiantes
- Gestion de asignaturas
- Sistema de matriculas
- Base de datos SQLite llena con datos de ejemplo
- Frontend en tiempo real

## Como funciona

### El flujo de autenticacion

Cuando te logueas, el sistema hace esto:

1. **Login**: Envias usuario y contrasena
2. **Token**: El servidor crea un token JWT (tipo Bearer)
3. **Almacenamiento**: El token se guarda en el navegador
4. **Requests**: Cada peticion a la API lleva ese token
5. **Autorizacion**: El servidor verifica el token antes de devolver datos

Es como un pase de acceso que le prueba al servidor que eres quien dices ser.

## Instalacion rapida

### 1. Descargar el proyecto

```bash
git clone https://github.com/kevinhndz/SistemaAcademico.git
cd SistemaAcademico
```

### 2. Crear el archivo .env

Crea un archivo llamado `.env` en la carpeta raiz:

```
SECRET_KEY=abcd1234efgh5678ijkl9012mnop3456
DATABASE_URL=sqlite:///./base_datos.db
```

### 3. Instalar dependencias

```bash
pip install -r requirements.txt
```

### 4. Ejecutar

```bash
python main.py
```

Entra a `http://localhost:8000`

## Prueba con las credenciales

```
Usuario: admin123
Contrasena: admin1234
```

Con esto tienes acceso a todo: ver estudiantes, crear asignaturas, hacer matriculas.

## Como probar la API

Hay una forma facil de probar todo sin codigo. El servidor tiene una pagina especial para eso.

### 1. Abre Swagger

Ve a `http://localhost:8000/docs`

Ahi ves todos los endpoints de la API de manera visual.

### 2. Obten un token

Busca `POST /login` en Swagger:

1. Haz clic en el endpoint
2. Presiona "Try it out"
3. Ingresa:
   ```json
   {
     "user": "admin123",
     "password": "admin1234"
   }
   ```
4. Presiona "Execute"
5. Ves la respuesta con el token:
   ```json
   {
     "user": "admin123",
     "boleto": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
     "rol": "Administrador"
   }
   ```

Copia ese `boleto` (es el token).

### 3. Autoriza en Swagger

En la esquina superior derecha de Swagger hay un boton "Authorize":

1. Presiona "Authorize"
2. En el campo escribe: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   (Reemplaza con tu token real)
3. Presiona "Authorize"
4. Listo, ya los siguientes requests van con el token

### 4. Prueba los endpoints

Ya con la autorizacion hecha, puedes probar:

**Ver estudiantes:**
- GET `/estudiantes/?page=1&size=10`
- Respuesta: lista de estudiantes

**Ver asignaturas:**
- GET `/asignaturas/?page=1&size=10`
- Respuesta: lista de asignaturas

**Ver matriculas:**
- GET `/matriculas/?page=1&size=10`
- Respuesta: lista de matriculas

### 5. Agrega datos

Prueba agregar datos nuevos por la API:

**Agregar estudiante:**

1. POST `/estudiantes/`
2. Body:
   ```json
   {
     "nombre": "Juan Perez",
     "telefono": "+504 9999 9999",
     "correo": "juan@example.com"
   }
   ```
3. Respuesta: Confirma que se agrego

**Agregar asignatura:**

1. POST `/asignaturas/`
2. Body:
   ```json
   {
     "nombre": "Programacion Avanzada",
     "creditos": 4,
     "seccion": "A",
     "dia": "Lunes",
     "horario": "2:00 PM"
   }
   ```
3. Se crea la asignatura

**Matricular estudiante:**

1. POST `/matriculas/`
2. Body:
   ```json
   {
     "id_est": 1,
     "id_asig": 1
   }
   ```
3. Se crea la matricula

### 6. Actualiza el frontend

Vuelve a `http://localhost:8000` (sin `/docs`)

El frontend carga automaticamente los datos nuevos. Ves la tabla actualizada sin refrescar nada.

## Como funciona por dentro

### La base de datos

Tiene 3 tablas principales:

```
estudiantes
├── id
├── nombre
├── telefono
└── correo

asignaturas
├── id
├── nombre
├── creditos
├── seccion
├── dia
└── horario

matriculas
├── id
├── id_est (referencia a estudiantes)
└── id_asig (referencia a asignaturas)
```

### El servidor (Backend)

Usa FastAPI, que es rapido y genera documentacion automaticamente.

Endpoints principales:

- `POST /login` - Obtiene token
- `GET /estudiantes/` - Lista estudiantes
- `POST /estudiantes/` - Crea estudiante
- `PUT /estudiantes/{id}` - Edita estudiante
- `DELETE /estudiantes/{id}` - Borra estudiante
- `GET /asignaturas/` - Lista asignaturas
- `POST /asignaturas/` - Crea asignatura
- (y lo mismo para asignaturas y matriculas)

Cada endpoint necesita el token en el header:

```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Sin token, devuelve error 401 (no autorizado).

### El frontend

Es HTML + CSS + JavaScript.

Cuando cargas la pagina:

1. Verifica que hay un token en el navegador
2. Si no hay, te manda al login
3. Si hay, carga los datos de estudiantes, asignaturas y matriculas
4. Usa ese token en cada peticion a la API
5. Muestra todo en tablas

## Roles y permisos

### Usuario: admin123

Tiene acceso total. Puede:
- Ver, crear, editar, eliminar estudiantes
- Ver, crear, editar, eliminar asignaturas
- Ver, crear, editar, eliminar matriculas

### Profesor

Tiene acceso limitado:
- Ver, crear, editar, eliminar estudiantes
- NO puede tocar asignaturas
- NO puede tocar matriculas

## Crea tu propio usuario

En la pagina de login, presiona "Crea una!"

Llena los datos:
- Nombre completo
- Telefono
- Email
- Cargo (Profesor o Administrador)
- Usuario (el que usaras para loguarte)
- Contrasena

Luego haz login con ese usuario.

## Tecnologias

- **FastAPI** - El servidor web
- **SQLAlchemy** - Para manejar la base de datos
- **SQLite** - La base de datos
- **JWT** - Tokens de autenticacion
- **JavaScript** - El frontend interactivo
- **CSS** - Los estilos

## Estructura del proyecto

Este proyecto esta organizado de una forma especifica porque cada carpeta tiene una responsabilidad clara. No es random, es un patron de software que facilita mantener y escalar el codigo.

```
SistemaAcademico/
├── main.py                 # Punto de entrada del servidor
├── base_datos.db          # La base de datos SQLite
├── requirements.txt       # Lista de dependencias
├── .env                   # Configuracion (no se sube a Git)
│
├── routers/               # Carpeta: Endpoints de la API
│   ├── login.py
│   ├── registrar.py
│   ├── estudiantes.py
│   ├── asignaturas.py
│   └── matriculas.py
│
├── models/                # Carpeta: Estructuras de datos
│   ├── tablas.py
│   ├── almacen.py
│   └── filtro_seguridad.py
│
├── utils/                 # Carpeta: Funciones reutilizables
│   ├── hash.py
│   ├── boletos.py
│   └── autenticacion.py
│
├── static/                # Carpeta: Frontend (CSS y JavaScript)
│   ├── estilos.css
│   ├── login.js
│   ├── signUp.js
│   └── general.js
│
└── templates/             # Carpeta: Paginas HTML
    ├── login.html
    ├── signUp.html
    └── general.html
```

### Por que esta dividido asi

La razon es **separacion de responsabilidades**. Cada carpeta hace una cosa especifica, eso hace el codigo:

- Mas facil de encontrar donde arreglar algo
- Mas facil de agregar nuevas features
- Menos codigo repetido
- Mas profesional

Es como tener una fabrica donde cada departamento hace su trabajo.

### Explicacion de cada carpeta

#### `main.py` - El punto de entrada

Es el archivo principal. Cuando ejecutas `python main.py`, esto es lo primero que corre.

```python
from fastapi import FastAPI
from routers import login, estudiantes, asignaturas, matriculas

app = FastAPI()

# Registra todos los routers
app.include_router(login.router)
app.include_router(estudiantes.router)
# ... etc
```

**Que hace:**
- Crea la aplicacion FastAPI
- Conecta la base de datos
- Registra todos los routers
- Monta los archivos estaticos (CSS, JavaScript)
- Inicia el servidor

Es el "manager" que pone todo a funcionar junto.

#### `routers/` - Los endpoints de la API

Aca van todos los endpoints (las rutas) que el frontend usa.

**Ejemplo: `routers/login.py`**

```python
from fastapi import APIRouter

router = APIRouter(prefix="/login", tags=["Login"])

@router.post("/")
def login(user, password):
    # Verifica usuario en BD
    # Crea un token JWT
    # Retorna token al frontend
    return {"boleto": token}
```

**Que hace cada archivo:**

- `login.py` - Maneja login y autenticacion
- `registrar.py` - Crea nuevos usuarios
- `estudiantes.py` - CRUD de estudiantes (Create, Read, Update, Delete)
- `asignaturas.py` - CRUD de asignaturas
- `matriculas.py` - CRUD de matriculas

Cada endpoint es una "puerta" que el frontend puede abrir para pedir datos o guardar cosas.

**Por que separado:** Porque cada modulo (estudiantes, asignaturas, etc) tiene sus propios endpoints. Si los pones todos en un archivo, se hace imposible de leer.

#### `models/` - Las estructuras de datos

Aca defines como se ve cada cosa en la base de datos y en la API.

**`models/tablas.py` - Las tablas de la BD**

```python
class Estudiantes(Base):
    __tablename__ = "estudiantes"
    
    id = Column(Integer, primary_key=True)
    nombre = Column(String)
    telefono = Column(String)
    correo = Column(String)
```

Esto le dice a SQLAlchemy: "Crea una tabla estudiantes con estos campos".

**`models/almacen.py` - La conexion a la BD**

```python
# Configuracion para conectar a SQLite
engine = create_engine("sqlite:///./base_datos.db")
SessionLocal = sessionmaker(bind=engine)
```

Esto es la "puerta" que abre la conexion a la base de datos.

**`models/filtro_seguridad.py` - Validacion de datos**

```python
class Revisar_JSON_de_Login(BaseModel):
    user: str
    password: str
```

Esto define: "Cuando el frontend envie un JSON para login, debe tener user y password. Si no, rechaza".

Es como un control de calidad que dice "este dato es valido" o "este no".

**Por que separado:** Porque la BD, la validacion y la conexion son cosas distintas. Si los mezclas, es confuso. Asi cada uno tiene su responsabilidad.

#### `utils/` - Funciones reutilizables

Aca van funciones que usas en muchos lugares. No quieres copiar-pegar codigo.

**`utils/hash.py` - Encriptacion de contrasenas**

```python
def hashear_contrasena(password):
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt())

def verificar_contrasena(password, hash):
    return bcrypt.checkpw(password.encode(), hash)
```

Usas estas funciones en `login.py` y `registrar.py`. Si las copiabas en ambos lugares, seria redundancia.

**`utils/boletos.py` - Generacion de tokens JWT**

```python
def crear_boleto(user, id, rol):
    payload = {
        "user": user,
        "id": id,
        "rol": rol
    }
    token = jwt.encode(payload, SECRET_KEY)
    return token
```

Esto crea el "pase" (token) que le das al usuario despues de login.

**`utils/autenticacion.py` - Verificacion de tokens**

```python
def verificar_token(token):
    payload = jwt.decode(token, SECRET_KEY)
    return payload
```

Cuando el frontend hace una peticion, el servidor verifica: "Es este token valido?". Esta funcion lo hace.

**Por que separado:** Porque estas funciones se usan en muchos routers. Si las pones en cada router, duplicas codigo. Las pones una sola vez, las importas donde necesites.

#### `static/` - Frontend (CSS y JavaScript)

Aca va todo lo que corre en el navegador del usuario.

**`static/estilos.css` - Los estilos**

Los colores, el espaciado, como se ven los botones, etc.

**`static/login.js` - La logica del login**

```javascript
document.getElementById("form-login").addEventListener("submit", async function(e) {
    const user = document.getElementById("user").value;
    const password = document.getElementById("password").value;
    
    // Hace POST /login
    const respuesta = await fetch("/login/", {
        method: "POST",
        body: JSON.stringify({user, password})
    });
    
    const datos = await respuesta.json();
    localStorage.setItem("boleto", datos.boleto); // Guarda el token
    window.location = "/general"; // Va a la pagina principal
});
```

**`static/signUp.js` - La logica del registro**

Parecido a login, pero para crear usuarios nuevos.

**`static/general.js` - La logica principal**

```javascript
const token = localStorage.getItem("boleto"); // Lee el token guardado

// Carga estudiantes
fetch("/estudiantes/?page=1&size=10", {
    headers: {"Authorization": `Bearer ${token}`}
}).then(res => res.json())
  .then(datos => {
    // Muestra los datos en la tabla
    dibujarTabla(datos.items);
  });
```

Este archivo:
- Lee el token
- Hace peticiones a la API con el token
- Recibe datos
- Los dibuja en las tablas

**Por que separado:** Porque cada pagina (login, signup, general) tiene su propia logica. Si lo pones todo junto, es un archivo de 1000 lineas. Separado, cada uno tiene 200-300 lineas y es claro.

#### `templates/` - Las paginas HTML

Las paginas que el usuario ve en el navegador.

**`templates/login.html`**

```html
<h1>Inicia Sesion</h1>
<form id="login">
    <input type="text" id="user" placeholder="Usuario">
    <input type="password" id="password" placeholder="Contrasena">
    <button type="submit">Login</button>
</form>
<script src="/static/login.js"></script>
```

**`templates/general.html`**

```html
<h1>Sistema de Gestion Educativa</h1>
<div id="modulos">
    <div id="estudiantes">
        <table id="tabla-estudiantes"></table>
    </div>
    <div id="asignaturas">
        <table id="tabla-asignaturas"></table>
    </div>
    <div id="matriculas">
        <table id="tabla-matriculas"></table>
    </div>
</div>
<script src="/static/general.js"></script>
```

**Por que separado:** Porque cada pagina es diferente. Login es simple, general es complejo con 3 tablas. Tenerlas separadas hace facil mantenerlas.

### Como todo se conecta

El flujo es asi:

```
Usuario abre navegador
    ↓
main.py sirve templates/login.html
    ↓
El usuario ve la pagina de login
    ↓
El usuario ingresa usuario y contrasena
    ↓
static/login.js hace POST a routers/login.py
    ↓
routers/login.py verifica en models/tablas.py (BD)
    ↓
routers/login.py usa utils/hash.py para verificar contrasena
    ↓
routers/login.py usa utils/boletos.py para crear token
    ↓
Retorna token al frontend
    ↓
static/login.js guarda token en localStorage
    ↓
main.py sirve templates/general.html
    ↓
static/general.js carga con el token guardado
    ↓
static/general.js hace GET a routers/estudiantes.py
    ↓
routers/estudiantes.py usa utils/autenticacion.py para verificar token
    ↓
Si token es valido, retorna datos de models/tablas.py (BD)
    ↓
static/general.js recibe datos
    ↓
static/general.js dibuja tablas en templates/general.html
    ↓
Usuario ve las tablas
```

### Por que es importante esta estructura

**1. Mantenibilidad**

Si hay un bug en la autenticacion, sabes exactamente donde buscar:
- `utils/autenticacion.py` o
- `routers/login.py`

No buscas en 20 archivos diferentes.

**2. Escalabilidad**

Si quieres agregar un nuevo modulo (por ejemplo, profesores):
- Creas `routers/profesores.py`
- Creas la tabla en `models/tablas.py`
- Creas `static/profesores.js`
- Creas `templates/profesores.html`

Sin romper nada del codigo existente.

**3. Reutilizacion**

La funcion `hashear_contrasena` en `utils/hash.py` la usas en:
- `routers/login.py`
- `routers/registrar.py`

Si no estuviera en utils, la duplicarias 2 veces.

**4. Colaboracion**

Si trabajan 2 personas:
- Una puede arreglar `routers/estudiantes.py`
- La otra puede arreglar `static/login.js`

Sin conflictos, porque son carpetas diferentes.

**5. Testing**

Puedes testear cada carpeta independiente:
- Testo `utils/hash.py` sin que importe el resto
- Testo `routers/login.py` sin que importe el resto

### Resumen

| Carpeta | Que hace | Ejemplo |
|---------|----------|---------|
| `routers/` | Endpoints de la API | GET /estudiantes, POST /login |
| `models/` | Definicion de datos y BD | Tabla estudiantes, validacion JSON |
| `utils/` | Funciones reutilizables | Encriptacion, tokens, autenticacion |
| `static/` | JavaScript y CSS | Logica del frontend, estilos |
| `templates/` | Paginas HTML | login.html, general.html |
| `main.py` | Punto de entrada | Conecta todo junto |

Esto es lo que se llama **arquitectura limpia**. Cada parte tiene su lugar, cada parte tiene una razon de estar ahi.

## La seguridad

### Contrasenas

Las contrasenas se hashean con bcrypt. Eso significa que nunca se guardan en texto plano. El servidor solo guarda un codigo aleatorio derivado de la contrasena.

Cuando te logueas, compara ese codigo, no la contrasena original.

### Tokens JWT

El token es una cadena encriptada que el servidor firma. Si alguien intenta modificarlo, el servidor lo detecta.

El token expira si lo necesita (aqui no tiene expiracion, pero en produccion si).

### Headers

Cada peticion a la API va con el token en el header `Authorization`. Sin token, el servidor rechaza.

## Ejemplo de flujo completo

1. Abro `http://localhost:8000`
2. Veo pagina de login
3. Ingreso `admin123` / `admin1234`
4. El frontend hace `POST /login` con esas credenciales
5. El servidor verifica en la base de datos y responde con un token
6. El frontend guarda el token en el navegador
7. El frontend redirige a `/general` (la pagina principal)
8. Ahora todas las peticiones llevan el token
9. Veo las tablas de estudiantes, asignaturas, matriculas
10. Puedo crear, editar, eliminar datos
11. El frontend hace peticiones a la API con el token
12. La API valida el token y procesa la peticion
13. El frontend actualiza las tablas automaticamente

## Que hice yo

Todo el proyecto. Desde el servidor hasta el frontend, incluyendo:

- La arquitectura con FastAPI y SQLAlchemy
- El sistema de autenticacion con JWT
- Las 3 tablas relacionadas
- Los endpoints de la API
- El frontend interactivo
- La validacion de datos
- El manejo de errores
- La seguridad con tokens

Podes ver el codigo en `https://github.com/kevinhndz/SistemaAcademico`

---

Eso es. Basicamente es un CRUD completo con autenticacion que funciona en tiempo real entre el frontend y la API.