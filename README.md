# ConjunApp Admin

Panel web de administración de conjuntos residenciales.

## Stack

- React 19 + TypeScript
- Vite 6
- Zustand + React Router

## Instalación

```bash
cp .env.example .env
npm install
npm run dev
```

Abrir http://localhost:5173

## Variables de entorno

| Variable | Descripción |
|----------|-------------|
| `VITE_API_BASE_URL` | Base de la API (default `http://localhost:8000/api/v1`) |

## Scripts

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Desarrollo |
| `npm run build` | Build producción |
| `npm run preview` | Preview del build |

## Docker

```bash
# Desde la raíz del monorepo
docker compose up --build admin
```

Producción (nginx en :8080):

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build admin
```

## Credenciales demo

`admin@conjunapp.com` / `admin123` (creadas por el seed del backend).

## Documentación

[../docs/Admin.md](../docs/Admin.md)
