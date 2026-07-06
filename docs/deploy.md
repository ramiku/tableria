# Despliegue en el servidor casero (Docker)

Esta guía cubre llevar Tableria del PC de desarrollo al PC que hace de
servidor casero, accesible por ahora solo en la LAN. **El túnel de
Cloudflare para acceso externo es un paso aparte, todavía no cubierto aquí.**

## Qué hay desplegado

Un solo contenedor de app (`Dockerfile` en la raíz) que sirve tanto la API
(Fastify + tRPC + WebSocket) como los estáticos ya compilados del frontend
desde el mismo origen — no hace falta nginx ni un segundo contenedor. Más un
contenedor de Postgres con su propio volumen de datos, independiente del de
desarrollo.

## Primer arranque

1. Copia (o `git pull` si ya es un clon) el proyecto a la carpeta del
   servidor.
2. Copia `.env.production.example` a `.env` en esa misma carpeta y rellena:
   - `POSTGRES_PASSWORD` y la contraseña dentro de `DATABASE_URL` (deben
     coincidir).
   - `SESSION_PEPPER` y `ENCRYPTION_KEY` — genera valores propios con:
     ```
     node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
     ```
     (uno para cada variable — no reutilices los del `.env` de desarrollo).
   - `WEB_ORIGIN` — de momento la IP/puerto de LAN de este PC
     (`http://192.168.1.101:3000` si no ha cambiado). Cuando más adelante
     montemos el túnel de Cloudflare, este valor pasará a ser
     `https://tu-dominio` y ahí las cookies de sesión se marcarán `Secure`
     automáticamente — no hay que tocar código para eso.
3. Construye y levanta:
   ```
   docker compose -f docker-compose.prod.yml up -d --build
   ```
   La primera construcción tarda varios minutos (instala todo el monorepo y
   compila cada paquete). Al arrancar, el contenedor `app` aplica las
   migraciones de base de datos pendientes y siembra el catálogo de juegos
   automáticamente (ambos pasos son idempotentes — seguros de repetir en
   cada arranque, así que no hay que preocuparse por ellos en reinicios
   posteriores).
4. Comprueba que responde:
   ```
   curl http://localhost:3000/health
   ```
   Debe devolver `{"ok":true,"db":"up",...}`. Desde cualquier otro
   dispositivo de la LAN, abre `http://192.168.1.101:3000` en el navegador —
   debería verse el catálogo de juegos y poder registrarte/entrar con
   normalidad.
5. **Regístrate desde la web** y luego márcate como admin a mano (esto NO es
   automático a propósito — a diferencia del catálogo, quién es admin es una
   decisión de seguridad, no un dato de la propia app):
   ```
   docker compose -f docker-compose.prod.yml exec postgres psql -U tableria -d tableria -c "UPDATE users SET is_admin = true WHERE email = 'tu-email@ejemplo.com'"
   ```
   (o `username = '...'` en vez de `email = '...'`). Recarga la página tras
   ejecutarlo y debería aparecer el enlace "Admin" en el menú.

## Ver logs / reiniciar

```
docker compose -f docker-compose.prod.yml logs -f app
docker compose -f docker-compose.prod.yml restart app
```

## Actualizar tras cambios de código

```
docker compose -f docker-compose.prod.yml up -d --build
```
Vuelve a construir la imagen (con el código nuevo) y reinicia solo el
contenedor `app` — Postgres y sus datos no se tocan. Las migraciones nuevas,
si las hay, se aplican solas al arrancar.

## Pendiente para más adelante (fuera de esta guía)

- **Cloudflare Tunnel**: para acceso externo por dominio sin abrir puertos
  en el router. Cuando llegue ese paso, recuerda actualizar `WEB_ORIGIN` en
  el `.env` al dominio real (`https://...`).
- **Email real**: configurar un proveedor SMTP de verdad (Gmail con
  contraseña de aplicación, SendGrid, Mailgun, tu propio hosting...) y
  actualizar `SMTP_HOST`/`SMTP_PORT`/`EMAIL_FROM` en el `.env`. Hasta
  entonces, "olvidé mi contraseña" y "entrar sin contraseña" no entregan
  correo real (el resto de la app funciona con normalidad).
- **Backups de Postgres**: el volumen `tableria_pgdata_prod` es persistente
  entre reinicios/actualizaciones, pero no hay todavía ninguna copia de
  seguridad automática configurada.
