# 🛠️ Checklist de Auditoría Visual y Funcional - Caxambu

## 🎨 UI / Estilos
- [x] ✅ **Features (Características):** Solucionada la superposición en el Home mediante CSS Grid.
- [x] ✅ **Modo Oscuro:** Estilos adaptados correctamente en el Home y login.
- [x] ✅ **Página de Perfil:** Maquetado completo conectado con la sesión actual.
- [ ] ❌ **Catálogo de Productos (Home):** Espacio vacío en "Los Mejores Productos". **Nota para Giuli:** Hay que cargar los documentos en la colección `productos` de Firestore para que se dibujen.
- [ ] ❌ **Refactorización:** El Header y Footer actualmente están "hardcodeados" dentro de `app.html`. Hay que mudarlos a sus propios componentes (`app-header`, `app-footer`).

## ⚙️ Funcionalidad y Rutas
- [x] ✅ **Conexión a Firebase:** Auth y Firestore configurados correctamente en `app.config.ts`.
- [x] ✅ **Botones del Header:** Navegación reparada (`app.ts` y `app.routes.ts`).
- [x] ✅ **Autenticación:** Login, registro, menú desplegable del usuario y cierre de sesión operativos.
- [x] ✅ **Rutas (`RouterOutlet`):** Navegación base completada.
- [ ] ❌ **Página Tienda (Catálogo/Carrito):** Actualmente vacía (`<p>tienda works!</p>`). Falta integrar el HTML y la lógica de carrito/remitos.
- [ ] ❌ **Página Admin (Vendedor):** Actualmente vacía. Falta integrar la tabla de gestión y pedidos.
- [ ] ❌ **Página Soporte:** Actualmente vacía. Falta maquetado.