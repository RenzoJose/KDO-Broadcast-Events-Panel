# KDO Broadcast Events Panel

Panel de visualización en pantalla gigante para eventos de Taekwondo.  
Aplicación web estática — HTML, CSS y JavaScript puro (sin frameworks).

---

## 📁 Estructura del proyecto

```
/
├── index.html                  # Punto de entrada de la app
├── public/
│   └── assets/
│       ├── images/             # Logos, fondos, íconos
│       └── fonts/              # Fuentes locales (.woff2 / .ttf)
└── src/
    ├── styles/
    │   ├── variables.css       # Tokens de diseño (colores, fuentes, espaciado)
    │   └── main.css            # Estilos globales y sistema de vistas
    ├── views/
    │   ├── agenda.html         # Markup de la pantalla de agenda
    │   ├── sorteo.html         # Markup de la pantalla de sorteo
    │   └── contador.html       # Markup de la pantalla del contador
    └── js/
        ├── app.js              # Inicialización global
        ├── core/
        │   ├── router.js       # Sistema de vistas (cambiarVista)
        │   └── state.js        # Estado compartido entre módulos
        └── modules/
            ├── agenda.js       # Lógica de la vista Agenda
            ├── sorteo.js       # Lógica de la vista Sorteo
            └── contador.js     # Lógica de la vista Contador
```

---

## 🚀 Cómo ejecutar

Abre `index.html` directamente en el navegador o usa un servidor local:

```bash
# Con VS Code: instala la extensión "Live Server" y haz clic en "Go Live"
# Con Node.js:
npx serve .
```

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
