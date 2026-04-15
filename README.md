# Mini Sales App

Aplicación web full stack para gestionar y evaluar ventas. Desarrollada como ejercicio técnico utilizando IA como herramienta principal de desarrollo (Claude Code).

## Quick Start

```bash
docker compose up --build
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:4000

No requiere configuración previa. Un solo comando levanta todo el entorno.

## Stack Técnico

| Capa | Tecnología | Justificación |
|------|-----------|---------------|
| Backend | Node.js + Express | Ligero, directo, sin boilerplate innecesario |
| Frontend | Next.js 14 (App Router) | React moderno con SSR y estructura escalable |
| Base de datos | SQLite + better-sqlite3 | Síncrono, cero configuración, ideal para el scope del proyecto |
| Estilos | CSS Modules | Scoped por componente, sin dependencias adicionales |
| Contenedores | Docker Compose | Un comando, dos servicios, entorno reproducible |
| Testing | Playwright + Bash/curl | Tests E2E de UI y API con cobertura completa |

## API Endpoints

| Método | Ruta | Descripción | Validaciones |
|--------|------|-------------|-------------|
| `GET` | `/api/sales` | Lista ventas (orden desc) | — |
| `POST` | `/api/sales` | Crea venta | `customer` y `product` requeridos, `amount > 0` |
| `POST` | `/api/sales/:id/evaluate` | Evalúa venta | `score` entero entre 1-5, venta debe existir (404) |
| `GET` | `/health` | Health check | — |

### Ejemplos

```bash
# Crear venta
curl -X POST http://localhost:4000/api/sales \
  -H 'Content-Type: application/json' \
  -d '{"customer":"Acme Corp","product":"Laptop","amount":1299.99}'

# Evaluar venta
curl -X POST http://localhost:4000/api/sales/1/evaluate \
  -H 'Content-Type: application/json' \
  -d '{"score":4}'
```

## Funcionalidades

### Requeridas
- Crear ventas (cliente, producto, monto)
- Listar ventas con todos los campos
- Evaluar ventas con score de 1 a 5

### Bonus implementados
- **Promedio de scores** — se muestra en tiempo real sobre la tabla, ignorando ventas sin evaluar
- **Validaciones en formularios** — doble capa: frontend (UX inmediata) + backend (integridad de datos)
- **Feedback visual** — toast de éxito al crear, spinner de carga, estados disabled durante peticiones
- **Mejora de UI** — selector de estrellas interactivo para score, formato moneda, hover en filas, responsive básico

## Testing

El proyecto incluye **36 tests** que cubren backend y frontend:

```bash
# Limpiar datos y levantar servicios
docker compose down -v && docker compose up -d

# Ejecutar suite completa (API + UI)
./run-tests.sh
```

### Cobertura de tests

**22 tests de API** (bash/curl):
- CRUD completo: crear, listar, evaluar, re-evaluar
- Orden descendente de resultados
- Cálculo de promedio de scores
- 10 tests de validación: campos vacíos, montos inválidos (0, negativos, texto), scores fuera de rango (0, 6, decimales), venta inexistente (404)

**14 tests de UI** (Playwright):
- Renderizado correcto de página, formulario y tabla
- Flujo completo: crear venta y verificar que aparece en tabla
- Validaciones del formulario (cliente, producto, monto vacíos)
- Validación nativa del browser (amount cero y negativo)
- Evaluación con estrellas y re-evaluación
- Promedio de scores visible tras evaluar
- Responsive en viewport móvil (375px)
- Estados de carga y feedback al usuario

## Decisiones Técnicas

**better-sqlite3 en lugar de sqlite3 async o un ORM:**
SQLite es inherentemente síncrono en disco. `better-sqlite3` respeta eso y es más rápido que wrappers async. Para este scope, un ORM agregaría complejidad sin beneficio.

**CSS Modules en lugar de Tailwind:**
Para una app de 3 componentes, CSS Modules mantiene los estilos scoped sin agregar una dependencia de build. Cada componente tiene su archivo `.module.css` co-ubicado.

**Evaluación inline con estrellas en lugar de modal:**
Reduce fricción — el usuario evalúa directamente en la tabla sin cambios de contexto. Un click y listo.

**Validación en dos capas:**
El frontend valida para dar feedback inmediato (UX). El backend valida para garantizar integridad (seguridad). Ambas capas son independientes — el backend no confía en el frontend.

**Docker volume para persistencia:**
Los datos de SQLite se almacenan en un volume nombrado. Persisten entre reinicios de contenedores. Se limpian explícitamente con `docker compose down -v`.

**WAL mode en SQLite:**
`PRAGMA journal_mode = WAL` permite lecturas concurrentes sin bloqueo. Buena práctica incluso en apps simples.

## Estructura del Proyecto

```
mini-sales-app/
├── docker-compose.yml
├── run-tests.sh                    # Suite completa de tests
├── playwright.config.ts
├── e2e/
│   └── sales.spec.ts               # 14 tests de UI
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   └── src/
│       ├── index.js                 # Express server (puerto 4000)
│       ├── db.js                    # Conexión SQLite + inicialización
│       └── routes/sales.js          # 3 endpoints con validaciones
└── frontend/
    ├── Dockerfile
    ├── next.config.js
    ├── package.json
    └── src/
        └── app/
            ├── layout.tsx
            ├── page.tsx             # Página principal
            ├── globals.css
            └── components/
                ├── SaleForm.tsx      # Formulario con validación
                ├── SalesTable.tsx    # Tabla + promedio de scores
                └── ScoreSelector.tsx # Estrellas interactivas
```

## Uso de IA en el Desarrollo

Este proyecto fue desarrollado utilizando **Claude Code** como herramienta principal. El proceso incluyó:

1. **Diseño del prompt inicial** — estructuré los requerimientos en un prompt detallado con stack, modelo de datos, endpoints, estructura de archivos y restricciones claras.

2. **Generación iterativa** — la app se construyó en capas: backend primero (Express + SQLite + rutas), luego frontend (Next.js + componentes), después Docker, y finalmente tests.

3. **Validación continua** — cada capa se verificó antes de avanzar a la siguiente. El backend se testeó con curl antes de conectar el frontend. El build de Next.js se verificó antes de dockerizar.

4. **Corrección en contexto** — cuando surgieron problemas (TypeScript 6 deprecando `moduleResolution: "node"`, CSS module imports sin type declarations), se diagnosticaron y corrigieron dentro de la misma sesión.

5. **Testing asistido por IA** — los 36 tests (API + Playwright) fueron generados y ejecutados con IA, incluyendo la corrección de tests que asumían comportamiento incorrecto (validación nativa del browser vs. JavaScript).

El criterio técnico se aplicó en: elección de dependencias mínimas, validación en dos capas, estructura clara de archivos, y decisiones de UX que priorizan simplicidad sobre complejidad.
