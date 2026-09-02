# 🌐 Nginx: Configuración de Reverse Proxy + Dominio + SSL/TLS

Guía paso a paso para configurar Nginx como Reverse Proxy en un servidor VPS Ubuntu, asignando un subdominio público en DuckDNS y protegiendo el tráfico con un certificado HTTPS gratuito usando Certbot.

---

## 🏗️ Arquitectura Nginx

### Nginx Proxy Flow

![Nginx Proxy Flow](/img/nginx-proxy-flow.png)

Este diagrama muestra cómo Nginx actúa como Reverse Proxy, distribuyendo las peticiones entre los diferentes contenedores.

---

## 💡 Nota de Arquitectura

Un solo servidor Nginx puede administrar múltiples aplicaciones en el mismo servidor usando diferentes dominios o puertos.

```
🌐 Internet (Cliente/Navegador)
       │
       ▼ [Puerto 80 (HTTP) / 443 (HTTPS)]
┌──────────────────────────────────────────────────────────┐
│ VPS / Droplet (Ubuntu)                                   │
│                                                          │
│   🚦 Nginx Global (Reverse Proxy + SSL)                  │
│       │                                                  │
│       ├─► app1.duckdns.org ──► Contenedor 1 (Port 8000)  │
│       ├─► app2.duckdns.org ──► Contenedor 2 (Port 3000)  │
│       └─► app3.duckdns.org ──► Contenedor 3 (Port 5000)  │
└──────────────────────────────────────────────────────────┘
```

---

## 📋 Requisitos Previos

- Tener la aplicación corriendo dentro del servidor en un puerto local (ej: `http://127.0.0.1:8000`)
- Conocer la IP pública del servidor VPS (ej: `159.65.223.239`)
- Acceso a un servidor VPS con Ubuntu instalado

---

## Paso 0: Instalación de Nginx y Certbot

> ⚠️ **Nota:** Si ya habías instalado Nginx o Certbot previamente en este servidor para otro proyecto, salta este paso y ve directo al Paso 1.

```bash
# 1. Actualizar repositorios e instalar Nginx
sudo apt update
sudo apt install -y nginx

# 2. Instalar Certbot y su conector para Nginx
sudo apt install -y certbot python3-certbot-nginx

# 3. Verificar que el servicio de Nginx esté activo
systemctl status nginx
```

---

## Paso 1: Crear el Subdominio en DuckDNS

1. Entra a la plataforma [DuckDNS.org](https://www.duckdns.org) e inicia sesión
2. En la sección de **subdomain**, escribe el nombre que le quieres dar a tu proyecto (ej: `uph-clinica`)
3. En el campo **current ip**, coloca la IP pública de tu servidor VPS
4. Haz clic en **Add Domain**
5. Tu proyecto ahora responde en: `uph-clinica.duckdns.org`

---

## Paso 2: Crear el Archivo de Configuración en Nginx

Crea un archivo de configuración por cada proyecto dentro del directorio `sites-available`:

```bash
sudo nano /etc/nginx/sites-available/uph-clinica
```

Dentro del archivo, coloca el bloque de configuración:

```nginx
server {
    listen 80;
    server_name uph-clinica.duckdns.org;  # Tu subdominio de DuckDNS

    location / {
        proxy_pass http://127.0.0.1:8000;  # Puerto local donde corre tu app
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

**Para guardar en Nano:** 
- Presiona `Ctrl + O` → `Enter`
- Sal con `Ctrl + X`

---

## Paso 3: Activar la Configuración en Nginx

Elimina la configuración por defecto (solo la primera vez):

```bash
sudo rm -f /etc/nginx/sites-enabled/default
```

Activa tu archivo de configuración creando un enlace simbólico:

```bash
sudo ln -s /etc/nginx/sites-available/uph-clinica /etc/nginx/sites-enabled/
```

Verifica la sintaxis para comprobar que no hay errores:

```bash
sudo nginx -t
```

> El sistema debe responder: `syntax is ok` y `test is successful`

Recarga Nginx para aplicar los cambios:

```bash
sudo systemctl reload nginx
```

---

## Paso 4: Generar el Certificado SSL/TLS (HTTPS) con Certbot

Ejecuta Certbot indicando el subdominio específico:

```bash
sudo certbot --nginx -d uph-clinica.duckdns.org
```

**Si es la primera vez usando Certbot:**
- Te pedirá un correo para notificaciones de vencimiento
- Acepta los términos (Y)

**Si ya lo habías usado antes:**
- Simplemente valida el dominio y genera el certificado automáticamente

Certbot modifica automáticamente tu archivo de configuración:
- ✅ Abre el puerto 443 (HTTPS)
- ✅ Redirige todo el tráfico HTTP no seguro a HTTPS
- ✅ Instala el certificado de seguridad

---

## ✅ Verificación Final

Una vez completados todos los pasos, tu aplicación debería estar disponible en:

```
https://uph-clinica.duckdns.org
```

Con:
- 🔒 Certificado SSL/TLS válido (candado verde en el navegador)
- ⚡ Reverse Proxy funcionando
- 🚀 Tráfico seguro HTTPS

---

## 🔄 Para Agregar Más Aplicaciones

Repite los Pasos 1-4 con diferentes:
- Subdominios en DuckDNS (ej: `app2.duckdns.org`, `app3.duckdns.org`)
- Puertos locales (ej: 3000, 5000)
- Nombres de configuración (ej: `/etc/nginx/sites-available/app2`)