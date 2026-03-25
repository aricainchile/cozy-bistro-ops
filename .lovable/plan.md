

# Plan: Autenticación Real con Roles de Usuario

## Resumen
Reemplazar el login demo por autenticación real usando Lovable Cloud, con sistema de roles (garzón, jefe de local, administrador) y control de acceso por módulo.

## Cambios en la Base de Datos (3 migraciones)

**1. Crear enum y tabla de roles**
- Enum `app_role` con valores: `garzon`, `jefe_local`, `admin`
- Tabla `user_roles` (id, user_id, role) con RLS
- Función `has_role(user_id, role)` como SECURITY DEFINER

**2. Crear tabla de perfiles**
- Tabla `profiles` (id, full_name, email, created_at) referenciando `auth.users`
- Trigger para auto-crear perfil al registrarse
- RLS: usuarios leen su perfil, admins leen todos

**3. Habilitar auto-confirm de emails** (para desarrollo, usando `configure_auth`)

## Cambios en el Código

**1. Contexto de autenticación** (`src/contexts/AuthContext.tsx`)
- Provider con estado de sesión, usuario, rol
- `onAuthStateChange` listener para sesión persistente
- Funciones: `signIn`, `signUp`, `signOut`
- Carga el rol del usuario desde `user_roles`
- Expone `userRole` y función `hasAccess(module)` basada en permisos

**2. Mapa de permisos** (`src/lib/permissions.ts`)
- Define qué módulos puede acceder cada rol:
  - Garzón: pedidos, mesas (ver)
  - Jefe local: pedidos, mesas, cuentas, inventario, caja
  - Admin: todos los módulos

**3. Actualizar Login** (`src/pages/Login.tsx`)
- Formulario con email/contraseña usando `supabase.auth.signInWithPassword`
- Opción de registro para nuevos usuarios
- Eliminar botones de demo y login falso

**4. Actualizar App.tsx**
- Envolver con `AuthProvider`
- Usar sesión real en vez de `useState`
- Proteger rutas según rol del usuario
- Mostrar nombre/rol real en el header del Layout

**5. Actualizar Layout.tsx**
- Filtrar menú lateral según permisos del rol
- Mostrar nombre real del usuario y botón de cerrar sesión funcional

## Detalle Técnico - Permisos por Rol

```text
Módulo        | Garzón | Jefe Local | Admin
--------------+--------+------------+------
Dashboard     |   ✓    |     ✓      |  ✓
Pedidos       |   ✓    |     ✓      |  ✓
Mesas (ver)   |   ✓    |     ✓      |  ✓
Mesas (edit)  |   ✗    |     ✓      |  ✓
Productos     |   ✗    |     ✗      |  ✓
Caja          |   ✗    |     ✓      |  ✓
Inventario    |   ✗    |     ✓      |  ✓
Usuarios      |   ✗    |     ✓      |  ✓
Impresión     |   ✓    |     ✓      |  ✓
Delivery      |   ✗    |     ✗      |  ✓
Fidelización  |   ✗    |     ✗      |  ✓
Personal      |   ✗    |     ✗      |  ✓
POS           |   ✗    |     ✓      |  ✓
Análisis      |   ✗    |     ✗      |  ✓
```

## Archivos a Crear/Modificar
- **Crear**: `src/contexts/AuthContext.tsx`, `src/lib/permissions.ts`
- **Modificar**: `src/pages/Login.tsx`, `src/App.tsx`, `src/components/Layout.tsx`
- **DB**: 2 migraciones (roles + profiles con triggers)

