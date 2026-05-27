# Productivity Front

App móvil hecha con **Expo + React Native + TypeScript + NativeWind (Tailwind)** para conectarse al backend `productivity_back`.

## Qué puedes hacer con esta app

- Iniciar sesión con username o email
- Crear cuenta nueva desde signup
- Mantener la sesión guardada localmente en el celular
- Ver y crear tareas
- Ver y crear hábitos
- Ver y crear goals
- Marcar tareas/goals como completados
- Hacer check y uncheck de hábitos
- Ver cómo cambian puntos, atributos y nivel en tiempo real
- Navegar en una interfaz **cyber glow** con estética neon

## Stack

| Tecnología | Uso |
|---|---|
| Expo | Ejecutar fácil en el celular |
| React Native | UI móvil |
| TypeScript | Tipado |
| NativeWind | Tailwind para React Native |
| Axios | Peticiones HTTP |
| React Navigation | Tabs principales |
| AsyncStorage | Persistir la sesión localmente |

## Requisitos

1. Backend `jdtp_backend` levantado en el puerto `8000`
2. Si usas celular físico, celular y PC en la misma red
3. Expo Go instalado en el celular
4. Node.js instalado en el computador

## Instalación


```

## Ejecutar la app

```powershell
cd C:\Proyectos\productivity_front
npm start
```

Luego:

1. Se abrirá Expo con un QR.
2. Abre **Expo Go** en tu celular.
3. Escanea el QR.
4. La app se cargará en el teléfono.

## Scripts útiles

```powershell
npm start
npm run android
npm run web
npm run typecheck
npm run doctor
npm run deploy:icons
npm run deploy:android:apk
npm run deploy:android:aab
npm run deploy:android
```

## Deploy Android (APK y AAB)

Antes de hacer deploy, asegúrate de tener sesión iniciada en EAS:

```powershell
npx eas login
```

Comandos disponibles:

```powershell
npm run deploy:android:apk   # genera APK (profile preview)
npm run deploy:android:aab   # genera AAB (profile production)
npm run deploy:android       # ejecuta ambos, en orden
```

Los scripts de deploy se ejecutan en modo no interactivo y no esperan a que termine la compilación (`--non-interactive --no-wait`), por lo que devuelven rápido y puedes seguir el progreso en Expo Build Dashboard.

El script `deploy:icons` prepara automáticamente los íconos personalizados para build:

- `assets/icon.png` -> 1024x1024
- `assets/android-icon-foreground.png` -> 432x432
- `assets/android-icon-background.png` -> 432x432
- `assets/android-icon-monochrome.png` -> 432x432
- `assets/favicon.png` -> 256x256
- `assets/splash-icon.png` -> 1242x1242

## URL base del backend

La configuración está centralizada en:

```ts
src/config/api.ts
```

Comportamiento por defecto (dev local):

```ts
// Si defines EXPO_PUBLIC_BACKEND_BASE_URL, esa gana.
// Si no, la app intenta detectar el host actual de Expo y usa ese mismo host con el puerto 8000.
```

La URL real se toma desde `EXPO_PUBLIC_BACKEND_BASE_URL` (si existe).

Si no defines esa variable, la app resuelve así:

1. **Expo Go / LAN**: usa automáticamente la IP de tu PC donde corre Expo, pero con puerto `8000`
2. **Android Emulator**: cae a `http://10.0.2.2:8000/`
3. **iOS Simulator / web / mismo computador**: cae a `http://127.0.0.1:8000/`

- `.env.production` -> `https://api.tu-dominio.com/`
- `production` (AAB Play Store) usa: `https://api.tu-dominio.com/`

Antes de subir a Play Store, reemplaza `https://api.tu-dominio.com/` por tu API pública real (idealmente HTTPS).

## Estructura del proyecto

```text
productivity_front
├─ App.tsx
├─ global.css
├─ tailwind.config.js
├─ babel.config.js
├─ metro.config.js
└─ src
   ├─ components
   ├─ config
   ├─ constants
   ├─ context
   ├─ screens
   ├─ services
   ├─ types
   └─ utils
```

## Explicación rápida para alguien nuevo en React Native

Si vienes de web, piensa así:

| Web | React Native |
|---|---|
| `div` | `View` |
| `p`, `span`, `h1` | `Text` |
| `input` | `TextInput` |
| `button` | `Pressable` |
| página | screen |
| CSS web | estilos de RN / NativeWind |

## Importante sobre CSS y Tailwind

En React Native no existe CSS del navegador como en React web.

Aquí se usa:

1. `global.css` como punto de entrada de Tailwind
2. **NativeWind** para traducir `className` a estilos válidos de React Native

Ejemplo:

```tsx
<View className="rounded-3xl border border-white/10 bg-slate-900/70 p-5">
  <Text className="text-xl font-bold text-white">Hola</Text>
</View>
```

## Qué hace cada carpeta

### `src/screens`

Contiene las pantallas visibles:

Ahora las pantallas visibles principales son:

- `AuthScreen.tsx`
- `DashboardScreen.tsx`
- `TasksScreen.tsx`
- `HabitsScreen.tsx`
- `GoalsScreen.tsx`

### `src/services`

Aquí viven las peticiones HTTP separadas por recurso:

- `users.ts`
- `tasks.ts`
- `habits.ts`
- `goals.ts`

### `src/context`

`AuthContext.tsx` gestiona:

- login
- signup
- sesión persistida
- logout
- refresco del usuario autenticado

`AppDataContext.tsx` guarda el estado funcional de la app:

- usuario autenticado
- tareas
- hábitos
- goals
- acciones para crear y actualizar

### `src/components`

Piezas reutilizables como botones, cards, banners y modales.

## Orden recomendado para aprender este proyecto

1. Lee `App.tsx`
2. Luego `src/context/AuthContext.tsx`
3. Después `src/context/AppDataContext.tsx`
4. Revisa `src/screens/AuthScreen.tsx`
5. Finalmente mira `src/services/users.ts`

Así entiendes:

- cómo arranca la app
- dónde vive el estado
- cómo se pinta la UI
- cómo se llama al backend

## Endpoints que consume

### Users

- `POST /api/users/login/`
- `POST /api/users/`
- `GET /api/users/{id}/`

### Tasks

- `GET /api/tasks/`
- `POST /api/tasks/`
- `POST /api/tasks/{id}/status/`

### Habits

- `GET /api/habits/?owner_id={id}`
- `POST /api/habits/`
- `POST /api/habits/{id}/check/`
- `DELETE /api/habits/{id}/check/`

### Goals

- `GET /api/goals/?owner_id={id}`
- `POST /api/goals/`
- `POST /api/goals/{id}/status/`

## Validación

### TypeScript

```powershell
npm run typecheck
```

### Expo Doctor

```powershell
npm run doctor
```

## Problemas comunes

### No inicia sesión

Revisa:

- que el backend esté levantado
- que el usuario exista
- que estés escribiendo bien el password

Puedes entrar con:

- username
- email

### El celular no conecta

Revisa:

- que el backend esté encendido
- que la IP siga siendo `192.168.1.10`
- que ambos equipos estén en la misma red

### Sale error de red

Suele significar:

- backend apagado
- IP distinta
- firewall bloqueando

### La sesión se pierde

La sesión queda guardada en AsyncStorage. Si el backend ya no reconoce al usuario o cambias la base de datos, vuelve a iniciar sesión.

## Resumen

Esta app ya queda lista para ejecutarse en Expo Go, conectarse al backend Django, iniciar sesión, registrar usuarios nuevos y servirte como base real para aprender React Native con una UI cyber glow.
