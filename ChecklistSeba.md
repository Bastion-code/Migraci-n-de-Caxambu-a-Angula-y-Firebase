## 🎨 UI / Estilos
- [x] ✅ **Features (Características):** Solucionada la superposición en el Home mediante CSS Grid.
- [x] ✅ **Modo Oscuro:** Estilos adaptados correctamente en el Home, recetas, tienda y login.
- [x] ✅ **Página de Perfil:** Maquetado completo conectado con la sesión actual e insignia de Administrador.
- [x] ✅ **Catálogo de Productos (Home):** Conectado con Firestore y renderizado dinámico de productos e imágenes.
- [x] ✅ **Módulo de Recetas Barista:** Master-Detail en 2 columnas, métricas de extracción y recomendación Caxambú.
- [x] ✅ **Sistema de Notificaciones Toast:** Reemplazo de los alert() nativos por toasts elegantes.

## ⚙️ Funcionalidad y Rutas
- [x] ✅ **Conexión a Firebase:** Auth y Firestore configurados correctamente en `app.config.ts`.
- [x] ✅ **Botones del Header:** Navegación reparada (`app.ts` y `app.routes.ts`).
- [x] ✅ **Autenticación (Registro):** Operativo y conectado con feedback visual.
- [x] ✅ **Autenticación (Login):** Operativo con redirección por rol (Mariano -> Admin, Cliente -> Tienda).
- [x] ✅ **Seguridad y Guard:** `adminGuard` restringe `/admin` y `/vendedor` exclusivamente a Mariano.
- [x] ✅ **Recuperación de Contraseña:** Modal funcional con `sendPasswordResetEmail` de Firebase.
- [x] ✅ **Página Tienda (Catálogo/Carrito):** Carrito interactivo, control de stock y remitos en PDF.
- [x] ✅ **Control de Stock y WhatsApp:** Badges de bajo stock, bloqueo de agotados y alerta a WhatsApp.
- [x] ✅ **Confirmación de Pedidos por WhatsApp:** Envío de comprobante detallado directo al WhatsApp de Mariano.
- [x] ✅ **Página Admin (Gestión de Inventario y Pedidos):** Actualización de stock, precios y aprobación/rechazo en tiempo real.
- [x] ✅ **Página Soporte:** Integrado con enlace directo al WhatsApp oficial de Caxambú.
