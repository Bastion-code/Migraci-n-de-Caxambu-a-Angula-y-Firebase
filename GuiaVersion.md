# Estado del proyecto — Caxambu Angular + Firebase

## ✅ Hecho
- Proyecto Angular v21 + Firebase conectado (usando SDK "firebase" directo,
  NO @angular/fire — no es compatible con Angular 21 todavía)
- Firebase: proyecto "caxambu" creado, Authentication (Email/contraseña)
  y Cloud Firestore (modo prueba) habilitados
- `src/app/services/auth.service.ts` — login, register, logout, currentUser$
- `src/app/guards/auth.guard.ts` — protege rutas /admin y /perfil (probado, funciona)
- `login.ts` / `login.html` — conectado a Firebase Auth, probado y funciona
- `registro.ts` / `registro.html` — conectado a Firebase Auth, probado y funciona
- `app.ts` — signal `currentUser` (con toSignal) para saber si hay sesión activa

## 🔧 En progreso / roto ahora mismo
- Botón de logout en el header (`app.html`, menú `nav-user`):
  - Agregamos `dropdownOpen` signal + `toggleDropdown()` en `app.ts`
  - Agregamos `(click)="toggleDropdown()"` en el avatar y `*ngIf="dropdownOpen()"`
    en el `<ul class="dropdown-menu">`
  - **NO está funcionando todavía** — el menú no se abre o el logout no dispara.
    Falta debuggear: revisar si `app.ts` y `app.html` quedaron bien guardados,
    si hay error en consola del navegador, y si el `*ngIf` está en el tag
    correcto del `<ul>`.

## ⏭️ Sigue después de arreglar el logout
- Actividad 2: CRUD completo con Firestore (falta 100%: no hay
  services/firestore, ni colecciones creadas, ni panel de admin real)
- Actividad 3: retomar buscador/API externa del segundo parcial dentro
  de esta nueva estructura Angular
- Actividad 4: funcionalidad extra individual (sin definir todavía)
- Actividad 5: informe técnico + deploy a Firebase Hosting (sin arrancar)
- Migrar contenido real a los componentes que siguen vacíos (stub):
  tienda, soporte, perfil, admin, header/footer (actualmente hardcodeados
  en app.html en vez de en shared/header y shared/footer)