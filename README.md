# DespensaAI - PWA de Inventario Doméstico Anti-Desperdicio

> PWA colaborativa para la gestión inteligente del inventario del hogar, diseñada para erradicar el desperdicio de alimentos y optimizar el ahorro familiar. Desarrollada con **Next.js 15+ (App Router)**, **Supabase (PostgreSQL + RLS)** y **Gemini 3.7 Flash**.

---

## 🌟 Características Principales

1. **Ingesta Inteligente Multimodal (Gemini 3.7 Flash)**:
   - Escaneo de fotos de tickets o dictado por voz (Web Speech API).
   - Normalización de nombres, descarte automático de artículos no comestibles y asignación óptima de zonas (`Nevera`, `Congelador`, `Despensa Seca`, `Frutero`).
   - Modal de Validación Express editable antes del guardado masivo en lote.

2. **Dashboard con Semáforo de Urgencia**:
   - 🔴 **Rojo**: Alimentos que caducan en $\le 48\text{ horas}$ o ya vencidos.
   - 🟡 **Amarillo**: Alimentos que caducan en 3 a 5 días.
   - 🟢 **Verde**: Alimentos frescos ($> 5\text{ días}$).
   - Banner de alerta proactiva con acceso directo a recetas de rescate.

3. **Motor de Recetas de Rescate Zero-Waste**:
   - Generación estructurada de recetas con Gemini 3.7 Flash focalizadas en agotar ingredientes en riesgo crítico.
   - Comparador de ingredientes rescatados vs. básicos de cocina y faltantes.
   - **Deducción atómica idempotente**: descuenta stock en una sola transacción, y si un producto llega a 0, se transfiere automáticamente a la lista de compras.

4. **Lista de Compras y Reabastecimiento Reactivo**:
   - Agrega sugerencias automáticas cuando los productos se agotan.
   - Micro-acción para pasar productos comprados directamente al inventario.

5. **Trazabilidad Financiera**:
   - Dinero total ahorrado por consumo vs. dinero perdido por descarte.
   - Cálculo del porcentaje de aprovechamiento del hogar.

6. **PWA Instalable**:
   - Web App Manifest configurado en modo `standalone`.
   - Service Worker con soporte de almacenamiento en caché offline.
   - Banner interactivo de instalación para dispositivos móviles (iOS y Android) y escritorio.

---

## 🛠️ Stack Tecnológico

| Capa | Tecnología |
|---|---|
| **Frontend** | Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons |
| **Backend** | Route Handlers de Next.js, Server Actions, Zod |
| **Base de Datos & Auth** | Supabase (PostgreSQL, Row Level Security, RPCs transaccionales) |
| **Inteligencia Artificial** | Google Gemini 3.7 Flash (`@google/genai` con Structured Outputs) |
| **Despliegue** | GitHub + Vercel |

---

## 🚀 Guía de Configuración y Despliegue

### 1. Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com).
2. Ve a la sección **SQL Editor**.
3. Abre el archivo [`supabase/setup_complete.sql`](./supabase/setup_complete.sql) de este repositorio, copia todo su contenido y pégalo en el editor SQL de Supabase. Haz clic en **Run**.
   - Esto creará todas las tablas, relaciones, triggers, políticas RLS y la función almacenada `deduct_recipe_atomic`.
4. Ve a **Project Settings -> API** y copia:
   - `Project URL`
   - `anon public key`
   - `service_role secret key`

### 2. Variables de Entorno

Copia `.env.example` a `.env.local` y asigna tus credenciales reales:

```bash
cp .env.example .env.local
```

Configura los valores:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key

# Gemini AI
GEMINI_API_KEY=tu-gemini-api-key
GEMINI_MODEL=gemini-3.7-flash

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Desarrollo Local

```bash
# Instalar dependencias
npm install

# Ejecutar tests de todos los sprints
npm test

# Iniciar servidor de desarrollo
npm run dev
```
Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

### 4. Despliegue en Vercel desde GitHub

1. Sube este repositorio a tu cuenta de GitHub:
   ```bash
   git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git
   git branch -M main
   git push -u origin main
   ```
2. Ve a [Vercel](https://vercel.com) y haz clic en **Add New -> Project**.
3. Importa tu repositorio de GitHub.
4. En la sección **Environment Variables**, añade las variables de entorno de Supabase y Gemini:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `GEMINI_API_KEY`
   - `GEMINI_MODEL` (`gemini-3.7-flash`)
   - `NEXT_PUBLIC_APP_URL` (la URL de tu dominio en Vercel)
5. Haz clic en **Deploy**. ¡Tu PWA estará en producción en minutos!

---

## 📋 Verificación de Sprints

Puedes ejecutar la suite de pruebas unitarias y de integración en cualquier momento con:

```bash
npm test
```

Esto ejecuta automáticamente los tests de:
- **Sprint 1**: Códigos de 12 caracteres, esquemas Zod de onboarding, semáforo de caducidad.
- **Sprint 2**: Normalización de tickets y validación de batch insert.
- **Sprint 3**: Motor de recetas con Gemini 3.7 Flash y deducción idempotente.
- **Sprint 4**: Metadatos PWA, reabastecimiento en lista de compras y métricas financieras.
