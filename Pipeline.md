# Guia: Despliegues Automaticos con GitHub Actions y Docker

Aqui esta una guia de como hacer cada deploy y que sea automaticos. Cada vez que haces push a main, GitHub acciona la magia y ep servidor se actualiza solo. No hay que estar entrando por SSH para hacer cada cambio.

---

## Tabla de Contenidos

1. [Llaves SSH](#paso-1-llaves-ssh)
2. [Secretos en GitHub](#paso-2-secretos-en-github)
3. [Crear la carpeta del pipeline](#paso-3-crear-la-carpeta)
4. [El archivo deploy.yml](#paso-4-el-archivo-deployyml)
5. [Probar que funcione](#paso-5-probar)

---

## Paso 1: Llaves SSH

Lo primero es que GitHub pueda acceder al servidor sin pedir contrasena. Para eso se usan las llaves SSH.

**Si no hay llaves SSH todavia: generalo aqui:**

```bash
ssh-keygen -t rsa -b 4096
```


## Paso 2: Secretos en GitHub

No se va a exponer las contrasenas ni las direcciones IP en el codigo. Para eso GitHub tiene un lugar para guardar secretos.

**Ir al repositorio en GitHub:**

1. Entra a Settings
2. Secrets and variables
3.  Actions

**Crea el primer secreto:**

- Click en "New repository secret"
- Name: `DROPLET_SSH_KEY`
- Secret: Aca va la llave privada

Para copiar el contenido de la llave privada:

```bash
cat ~/.ssh/id_rsa
```

Copiar TODO, desde: `-----BEGIN RSA PRIVATE KEY-----` y `-----END RSA PRIVATE KEY-----`.

**Crea el segundo secreto:**

- Name: `DROPLET_IP`
- Secret: direccion IP del servidor

Por ejemplo: `123.45.67.89`

Listo, GitHub ya tiene los datos sensibles guardados de forma segura.

---

## Paso 3: Crear la Carpeta del Pipeline

En la raiz del proyecto local, ejecutar:

```bash
mkdir -p .github/workflows
```

Esto crea la carpeta donde van los archivos de GitHub Actions. Tiene que ir asi ese orden ya que GitHub Actions busca el archivo .YML de esa forma.


---

## Paso 4: El Archivo deploy.yml

Dentro de `.github/workflows/`, crear un archivo llamado exactamente `deploy.yml` y pegar esto adentro:

```yaml
name: Deploy Automatico a Produccion

on:
  push:
    branches: [ "main" ]

jobs:
  deploy:
    runs-on: ubuntu-latest

    steps:
    - name: Checkout del codigo
      uses: actions/checkout@v3

    - name: Ejecutar SSH y actualizar servidor
      uses: appleboy/ssh-action@master
      with:
        host: ${{ secrets.DROPLET_IP }}
        username: root
        key: ${{ secrets.DROPLET_SSH_KEY }}
        script: |
          cd /root/NOMBRE-DEl-REPOSITORIO
          git pull origin main
          docker compose down
          docker compose up -d --build
          docker system prune -f
```

**Que hace este archivo:**

- `on: push:` significa que se activa cada vez que haces push a main
- El action `appleboy/ssh-action` se conecta a tu servidor por SSH
- Usa los secretos que guardaste en GitHub (`DROPLET_IP` y `DROPLET_SSH_KEY`)
- Se va a la carpeta de tu proyecto
- Tira un `git pull` para bajar los cambios nuevos
- Detiene los contenedores viejos con `docker compose down`
- Levanta los nuevos con `docker compose up -d --build`
- Limpia con `docker system prune -f` para no acumular imagenes basura

---

## Paso 5: Probar que Funcione

**Subir los cambios:**

```bash
git add .
git commit -m "feat: agrego pipeline de CI/CD"
git push origin main
```

**Verificar que el pipeline arranque:**

1. IR al repositorio en GitHub
2. Toca en la pestana "Actions"
3. Deberia aparecer un workflow corriendo

Si sale en verde, todo bien. Si sale en rojo, algo fallo.



