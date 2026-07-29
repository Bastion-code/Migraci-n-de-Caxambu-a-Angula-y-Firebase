## 🎨 UI / Estilos
- [x] ✅ **Features (Características):** Solucionada la superposición en el Home mediante CSS Grid.
- [x] ✅ **Modo Oscuro:** Estilos adaptados correctamente en el Home y login.
- [x] ✅ **Página de Perfil:** Maquetado completo conectado con la sesión actual.
- [x] ✅ **Catálogo de Productos (Home):** Conectado con Firestore y renderizado dinámico de productos e imágenes.
- [ ] ❌ **Refactorización:** El Header y Footer actualmente están "hardcodeados" dentro de `app.html`. Hay que mudarlos a sus propios componentes (`app-header`, `app-footer`).
- [ ] ❌ **Corrección de Diseño (Registro):** Solucionar la superposición de etiquetas e inputs en la vista de registro (`registro.component.css / html`).

## ⚙️ Funcionalidad y Rutas
- [x] ✅ **Conexión a Firebase:** Auth y Firestore configurados correctamente en `app.config.ts`.
- [x] ✅ **Botones del Header:** Navegación reparada (`app.ts` y `app.routes.ts`).
- [x] ✅ **Autenticación (Registro):** Operativo y conectado.
- [x] ✅ **Rutas (`RouterOutlet`):** Navegación base completada.
- [ ] ❌ **Autenticación (Login):** Investigar y solucionar el error de rechazo de credenciales al iniciar sesión.
- [ ] ❌ **Recuperación de Contraseña:** Implementar la opción de **"¿Olvidaste tu contraseña?"** en el login mediante Firebase (`sendPasswordResetEmail`).
- [ ] ❌ **Página Tienda (Catálogo/Carrito):** Actualmente vacía (`<p>tienda works!</p>`). Falta integrar el HTML y la lógica de carrito/remitos.
- [ ] ❌ **Página Admin (Vendedor):** Actualmente vacía. Falta integrar la tabla de gestión y pedidos.
- [ ] ❌ **Página Soporte:** Actualmente vacía. Falta maquetado.