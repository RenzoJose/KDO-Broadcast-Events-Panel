# KDO Broadcast Events Panel

Panel de visualización en pantalla gigante para eventos de Taekwondo.  
Aplicación web estática — HTML, CSS y JavaScript puro (sin frameworks).

---

## 📁 Estructura del proyecto

```
/
├── index.html                      # Punto de entrada del dashboard
├── db.json                         # Datos mock del evento (json-server)
├── package.json
├── public/
│   └── assets/
│       ├── images/                 # Logos, fondos, íconos
│       ├── fonts/                  # Fuentes locales (.woff2 / .ttf)
│       └── sounds/                 # Efectos de audio
└── src/
    ├── styles/
    │   ├── variables.css           # Tokens globales de diseño
    │   ├── main.css                # Entrada de estilos del dashboard (@imports)
    │   ├── agenda.css              # Entrada standalone de la vista Agenda
    │   ├── contador.css            # Entrada standalone de la vista Contador
    │   ├── base/
    │   │   ├── reset.css
    │   │   ├── typography.css
    │   │   └── utilities.css
    │   ├── layout/
    │   │   ├── dashboard.css       # Sidebar + panel principal
    │   │   └── views.css           # Sistema de vistas activas
    │   └── modules/
    │       ├── agenda-base.css     # Componentes .ag-* compartidos
    │       ├── agenda.css          # Overrides del módulo dashboard
    │       ├── contador-base.css   # Componentes .ct-* compartidos
    │       ├── contador.css        # Overrides del módulo dashboard
    │       ├── sorteo.css
    │       ├── resultados.css
    │       └── fight-scene.css
    ├── views/
    │   ├── agenda.html             # Vista standalone (pantalla LED)
    │   ├── sorteo.html
    │   └── contador.html           # Vista standalone (pantalla LED)
    └── js/
        ├── app.js                  # Inicialización global
        ├── agenda-view.js          # Bootstrap de la vista standalone Agenda
        ├── contador-view.js        # Bootstrap de la vista standalone Contador
        ├── core/
        │   ├── router.js           # Sistema de vistas (cambiarVista)
        │   └── state.js            # Estado compartido entre módulos
        └── modules/
            ├── agenda.js           # Lógica de la vista Agenda
            ├── sorteo.js           # Lógica de la vista Sorteo
            ├── resultados.js       # Lógica de la vista Resultados
            ├── contador.js         # Lógica de la vista Contador
            └── sorteo.js
```

---

## 🚀 Cómo ejecutar

### Prerrequisitos

- [Node.js](https://nodejs.org/) v18+

### Instalación

```bash
npm install
```

### Desarrollo (recomendado)

Inicia ambos servidores a la vez:

```bash
npm run dev
```

| Servidor | Puerto | Descripción |
|---|---|---|
| `http-server` | [http://localhost:5500](http://localhost:5500) | Sirve la app |
| `json-server` | [http://localhost:3001](http://localhost:3001) | API mock (`db.json`) |

### Comandos individuales

```bash
npm run serve   # Solo la app (sin API)
npm run mock    # Solo json-server
```

---

## 🗄️ API Mock (json-server)

Los datos del evento se sirven desde `db.json`. Con el servidor activo:

| Endpoint | Descripción |
|---|---|
| `GET /athletes` | Lista de atletas con nombre, escuela y logo |

Para agregar o editar atletas, modifica `db.json` directamente — json-server recarga automáticamente.

---

## 🖥️ Vistas standalone

Algunas pantallas están diseñadas para proyectarse en una **segunda pantalla o pantalla LED**. Se abren de forma independiente en una ventana del navegador aparte:

| Vista | URL | Descripción |
|---|---|---|
| Contador | `http://localhost:5500/src/views/contador.html` | Cronómetro a pantalla completa |
| Agenda | `http://localhost:5500/src/views/agenda.html` | Cronograma a pantalla completa |

> ⚠️ Estas vistas necesitan que `http-server` esté corriendo (`npm run serve` o `npm run dev`). No funcionan abriéndolas directamente como archivo local por las restricciones de CORS en los `@import` de CSS.

---

## 🤝 División de trabajo

| Desarrollador | Archivos |
|---|---|
| Dev 1 | `agenda.js`, `views/agenda.html`, `contador.js`, `views/contador.html` |
| Dev 2 | `sorteo.js`, `views/sorteo.html` |
| Compartido | `app.js`, `core/router.js`, `core/state.js`, `styles/` |

---

## 🖥️ Vistas disponibles

| Vista | ID | Descripción |
|---|---|---|
| Agenda | `agenda` | Cronograma general del evento |
| Sorteo | `sorteo` | Visualización del sorteo de combates |
| Contador | `contador` | Cronómetro / marcador en tiempo real |

Para cambiar de vista desde cualquier parte del código:

```js
import { cambiarVista } from './core/router.js';
cambiarVista('sorteo');
```
