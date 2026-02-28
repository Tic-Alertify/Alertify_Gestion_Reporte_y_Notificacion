# Alertify - Sistema de Validación y Gestión de Reportes Ciudadanos

El modulo de Gestión de Reporte y Notificación permite a ciudadanos que estas dentro DMQ reportar incidentes en tiempo real (delitos, sospechas de incidentes a robos) con un sistema inteligente de validación basado en reputación, densidad histórica y clústeres en vivo. Los reportes validados se distribuyen mediante notificaciones push a través de Firebase.

---

## 📋 Tabla de Contenidos

- [Descripción General](#descripción-general)
- [Tecnologías Utilizadas](#tecnologías-utilizadas)
- [Requisitos Previos](#requisitos-previos)
- [Instalación y Configuración](#instalación-y-configuración)
- [Cómo Ejecutar](#cómo-ejecutar)
- [Arquitectura y Flujo de Datos](#arquitectura-y-flujo-de-datos)
- [Algoritmo de Validación](#algoritmo-de-validación)
- [Almacenamiento de Reportes](#almacenamiento-de-reportes)
- [Estructura del Proyecto](#estructura-del-proyecto)
- [Endpoints Disponibles](#endpoints-disponibles)

---

## 📱 Descripción General

### **Alertify Backend**
Microservicio construido en **NestJS** que gestiona:
- **Ingesta de reportes ciudadanos**: Recibe reportes con ubicación geográfica (latitude/longitude) desde la aplicación móvil
- **Validación asíncrona**: Procesa reportes en una cola (Redis/BullMQ) para calcular un score de confianza
- **Gestión de usuarios**: Mantiene un sistema de reputación para cada usuario
- **Consultas espaciales**: Utiliza SQL Server 2022 con tipos de datos geográficos (GEOGRAPHY) para análisis geoespaciales
- **Notificaciones**: Integración con Firebase para alertas en tiempo real

### **Alertify Frontend**
Aplicación Android nativa en **Kotlin** que permite:
- Capturar la ubicación GPS del usuario en tiempo real
- Seleccionar tipo de incidente (robo, accidente, sospechoso, etc.)
- Agregar descripción y fotos del incidente
- Recibir notificaciones push de reportes validados cercanos
- Ver mapa interactivo con reportes activos

---

## 🛠️ Tecnologías Utilizadas

### **Backend**
| Tecnología | Propósito |
|-|-|
| **NestJS 11** | Framework TypeScript para APIs REST |
| **TypeORM 0.3** | ORM para mapeo de entidades a base de datos |
| **SQL Server 2022** | Base de datos con soporte para tipos GEOGRAPHY |
| **Redis 7** | Cache y broker de eventos |
| **BullMQ 5** | Sistema de colas para procesamiento asíncrono |
| **Bull Board** | Interfaz web para monitorear colas |
| **Class Validator** | Validación de DTOs |
| **Docker Compose** | Orquestación de servicios |

### **Frontend**
| Tecnología | Propósito |
|-|-|
| **Kotlin 2.0** | Lenguaje de programación principal |
| **Android SDK 36** | Framework Android |
| **Retrofit 2.9** | Cliente HTTP para comunicación con API |
| **Google Play Services Maps** | Mapas e integración de ubicación |
| **Google Play Services Location** | API de geolocalización GPS |
| **Firebase Messaging** | Push notifications |
| **Jetpack Navigation** | Navegación entre pantallas |
| **Jetpack Lifecycle** | Gestión del ciclo de vida |

---

## ✅ Requisitos Previos

### **Para el Backend:**
- **Docker Desktop** (con Docker Compose)
- **Node.js 18+** y **npm 9+**
- **TypeScript 5+**
- **Git**

### **Para el Frontend:**
- **Android Studio (Flamingo o superior)**
- **Java JDK 11+**
- **Gradle 8.13+**
- **Dispositivo Android 7.0+ (API 24+)** o emulador

### **Hardware recomendado:**
- RAM: 8 GB (mínimo)
- Espacio en disco: 20 GB
- CPU multi-núcleo

---

## 🚀 Instalación y Configuración

### **Paso 1: Clonar el repositorio**

```bash
git clone <https://github.com/Tic-Alertify/Alertify_Gestion_Reporte_y_Notificacion.git>
cd programa
```

### **Paso 2: Configurar el Backend**

#### 2.1 Instalar dependencias

```bash
cd alertify-backend
npm install
```

#### 2.2 Crear archivo `.env`

```bash
# En alertify-backend/ crea un archivo .env
cat > .env << 'EOF'
# Base de Datos SQL Server
DB_HOST=localhost
DB_PORT=1433
DB_USERNAME=sa
DB_PASSWORD=Alertify_Pass2026!
DB_DATABASE=AlertifyDB

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Aplicación
PORT=3000
NODE_ENV=development
JWT_SECRET=tu_secret_key_aqui

# Firebase (Opcional, necesario para notificaciones)
FIREBASE_PROJECT_ID=alertify-xxx
FIREBASE_PRIVATE_KEY=...
FIREBASE_CLIENT_EMAIL=...
EOF
```

#### 2.3 Levantar servicios con Docker

```bash
# Desde la raíz del proyecto
docker-compose up -d
```

Esto levantará:
- **SQL Server 2022** en puerto `1433` con usuario `sa` / contraseña `Alertify_Pass2026!`
- **Redis 7** en puerto `6379`

**Espera 30-60 segundos** a que SQL Server inicie completamente.

### **Paso 3: Configurar el Frontend**

#### 3.1 Abrir en Android Studio

```bash
cd alertify-frontend
open -a "Android Studio" .
```

(En Windows: Abre Android Studio y selecciona "Open Project")

#### 3.2 Sincronizar Gradle

Android Studio descargará automáticamente dependencias. Si hay problemas:

```bash
./gradlew build
```

#### 3.3 Crear emulador (o usar dispositivo físico)

En Android Studio:
1. **Tools → Device Manager**
2. **Create Device** → Pixel 6 Pro, Android 13+ (API 33+)
3. **Start** para lanzar el emulador

---

## 🎯 Cómo Ejecutar

### **Ejecutar el Backend**

#### Opción A: En desarrollo con auto-recarga

```bash
cd alertify-backend
npm run start:dev
```

**Output esperado:**
```
[Nest] 12345   - 02/28/2026, 10:30:15 AM     LOG [NestFactory] Starting Nest application...
[Nest] 12345   - 02/28/2026, 10:30:20 AM     LOG [InstanceLoader] TypeOrmModule dependencies initialized
Application is running on: http://localhost:3000
Visible en la red: http://192.168.100.35:3000
```

#### Opción B: Modo debug

```bash
npm run start:debug
```

Adjunta VS Code debugger a `localhost:9229`

### **Ejecutar el Frontend**

#### En Emulador:
1. En Android Studio: **Run → Run 'app'** (o presiona `Shift + F10`)
2. Selecciona el emulador de la lista

#### En Dispositivo Físico:
1. Conecta dispositivo via USB
2. Habilita "Depuración de USB"
3. **Run → Run 'app'**

### **Monitorear Colas (Bull Board)**

Una vez que el backend esté corriendo, abre:

```
http://localhost:3000/admin/queues
```

Verás la cola `report-validation` en tiempo real con trabajos procesándose.

---

## 🔄 Arquitectura y Flujo de Datos

### **Diagrama de Flujo Completo**

```
[App Android]
     ↓
  (1) GPS + Tipo Incidente + Descripción
     ↓
[Backend - POST /reports]
     ↓ (2) Validación Geográfica (Geofencing Quito)
    ✓ En zona → Continua
    ✗ Fuera zona → Error 400
     ↓ (3) Guardar en SQL Server
  REPORTES_CIUDADANOS
  └─ IdReporte: INT (PK)
  └─ IdUsuario: INT (FK)
  └─ UbicacionGeografica: GEOGRAPHY (POINT)
  └─ Estado: TINYINT (0: Pendiente, 1: Validado, 2: Rechazado)
  └─ PuntajeConfianza: DECIMAL(5,2)
  └─ FechaHoraRegistro: DATETIME
     ↓ (4) Publicar en Cola Redis (BullMQ)
  {
    reportId: 123,
    location: "POINT(-78.48 -0.22)"
  }
     ↓ (5) Procesamiento Asíncrono (ValidationProcessor)
     ├─ Obtener score reputación del usuario
     ├─ Calcular densidad histórica (SQL Server STDistance)
     ├─ Detectar clústeres en vivo
     └─ Ejecutar Algoritmo de Confianza
     ↓ (6) Actualizar estado del reporte
    Estado = 1 (Validado) si Score ≥ 0.7
    Estado = 2 (Rechazado) si Score < 0.7
     ↓ (7) Enviar notificación Firebase (Futura integración)
[Firebase Cloud Messaging]
     ↓
[Apps registradas reciben PUSH]
```

### **Componentes Principales**

#### 1. **API REST (NestJS)**
- `POST /reports` - Ingestar nuevo reporte
- `GET /reports/validated` - Obtener reportes validados
- `GET /users/:id` - Información de usuario y reputación

#### 2. **Base de Datos (SQL Server)**

**Tabla: REPORTES_CIUDADANOS**
```sql
CREATE TABLE REPORTES_CIUDADANOS (
  IdReporte INT PRIMARY KEY IDENTITY(1,1),
  IdUsuario INT FOREIGN KEY,
  IdTipoIncidente INT,
  UbicacionGeografica GEOGRAPHY, -- Type: POINT, SRID: 4326
  Descripcion NVARCHAR(MAX),
  Estado TINYINT DEFAULT 0,
  PuntajeConfianza DECIMAL(5,2) DEFAULT 0,
  FechaHoraRegistro DATETIME DEFAULT GETDATE()
)
```

**Tabla: USUARIOS**
```sql
CREATE TABLE USUARIOS (
  IdUsuario INT PRIMARY KEY IDENTITY(1,1),
  Email VARCHAR(255) UNIQUE,
  Password VARCHAR(255), -- bcrypt hashed
  PuntajeReputacion DECIMAL(5,2) DEFAULT 5.0
)
```

#### 3. **Sistema de Colas (Redis + BullMQ)**
- Desacopla la ingesta de reportes del procesamiento
- Permite reprocesamiento de reportes fallidos
- Escalable horizontalmente

---

## 🧠 Algoritmo de Validación

El algoritmo de confianza (Confidence Score) se calcula mediante una **fórmula ponderada** que integra 3 factores:

### **Factores del Score**

#### 1. **Reputación del Usuario (40% del peso)**
```
scoreReputacion = (PuntajeReputacion / 10)
```
- Rango: 0 a 1
- Usuarios nuevos comienzan con 5.0 puntos (score = 0.5)
- Se ajusta según calidad histórica de reportes

**Cálculo:**
```typescript
const scoreReputation = user.PuntajeReputacion / 10; // Ej: 7.5 → 0.75
```

#### 2. **Densidad Histórica (30% del peso)**
Consulta de datos históricos dentro de un radio de **500 metros**:

```sql
SELECT COUNT(*) as count 
FROM HISTORIAL_OFICIAL_INCIDENTES 
WHERE UbicacionGeografica.STDistance(
    geography::STGeomFromText('POINT(-78.48 -0.22)', 4326)
) <= 500
```

**Lógica:**
- Si hay **más de 5 incidentes históricos en la zona** → score = 1.0
- Si hay **menos** → score = 0.5
- Esto valida que el área sea proclive a ese tipo de incidente

#### 3. **Clústeres en Vivo (30% del peso)**
Detecta si hay múltiples reportes coincidentes en la **última hora**:

```typescript
private async calculateLiveClusters(locationWkt: string): Promise<number> {
  // Busca otros reportes cidudanos similares en la última hora
  // Si hay múltiples → aumenta confianza
  return 0.8; // Versión simplificada
}
```

### **Fórmula Final**

CS = (R × 0.4) + (H × 0.3) + (C × 0.3)

Donde:
- **R** = Score de Reputación (0-1)
- **H** = Score de Densidad Histórica (0-1)
- **C** = Score de Clústeres en Vivo (0-1)

### **Criterio de Validación**

```
Si CS ≥ 0.7 → Estado = 1 (VALIDADO)
Si CS < 0.7 → Estado = 2 (RECHAZADO)
```

### **Ejemplo Práctico**

```
Usuario: Ana (Reputación 8.0)
Ubicación: Centro Quito
Tipo: Robo a mano armada

R = 8.0 / 10 = 0.80
H = 1.0 (hay 12 robos históricos en radio 500m)
C = 0.8 (3 reportes similares en última hora)

CS = (0.80 × 0.4) + (1.0 × 0.3) + (0.8 × 0.3)
   = 0.32 + 0.30 + 0.24
   = 0.86 ≥ 0.7
   
→ VALIDADO ✓
```

---

## 📦 Almacenamiento de Reportes

### **Flujo de Almacenamiento**

```
Reporte Ingresado (Estado = 0)
    ↓
Validaciones Previas (Geofencing)
    ↓
Guardado en SQL Server (REPORTES_CIUDADANOS)
    ↓
Publicado en Cola Redis (report-validation)
    ↓
Procesado por ValidationProcessor
    ↓
Actualizado con PuntajeConfianza y Estado Final
    ↓
Disponible en GET /reports/validated (si Estado = 1)
```

### **Detalles Técnicos**

#### **Tipo de Dato Geográfico**

```typescript
@Column({
  type: 'geography',              // Tipo espacial SQL Server
  spatialFeatureType: 'Point',    // El reporte es un punto
  srid: 4326,                     // WGS84 - Sistema GPS estándar
})
UbicacionGeografica: string;      // Formato: "POINT(-78.48 -0.22)"
```

**Ventajas:**
- Búsquedas de proximidad nativas en SQL Server
- Cálculo automático de distancias (STDistance)
- Soporte para consultas geoespaciales complejas

#### **Persistencia**

```typescript
// 1. Convertir lat/long a formato WKT
const pointWkt = `POINT(${longitude} ${latitude})`; // Nota: POINT(Long, Lat)

// 2. Crear entidad
const newReport = this.reportRepository.create({
  IdUsuario: dto.userId,
  IdTipoIncidente: dto.incidentTypeId,
  UbicacionGeografica: pointWkt,
  Descripcion: dto.description,
  Estado: 0,  // Pendiente
  PuntajeConfianza: 0.0,
});

// 3. Guardar
const savedReport = await this.reportRepository.save(newReport);

// 4. Publicar en cola
await this.reportQueue.add('validate-report', {
  reportId: savedReport.IdReporte,
  location: pointWkt
});
```

#### **Recuperación**

```typescript
// Obtener solo reportes VALIDADOS
async getValidatedReports() {
  return await this.reportRepository
    .createQueryBuilder('report')
    .select([
      'report.IdReporte as id',
      'report.Descripcion as description',
      'report.UbicacionGeografica.Lat as latitude',
      'report.UbicacionGeografica.Long as longitude'
    ])
    .where('report.Estado = :estado', { estado: 1 })
    .getRawMany();
}
```

### **Gestión de Transacciones**

Por defecto, **TypeORM + SQL Server** usa aislamiento READ COMMITTED:
- Lectura sucia: ✗ Prohibida
- Lectura fantasma: Posible (aceptable para reportes)
- Deadlocks: Mínimos (sin lotes grandes)

---

## 📁 Estructura del Proyecto

```
programa/
├── README.md                          # Este archivo
├── docker-compose.yml                 # Servicios: SQL Server + Redis
│
├── alertify-backend/                  # Microservicio NestJS
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── docker-compose.yml
│   ├── .env                          # Crear manualmente
│   │
│   ├── src/
│   │   ├── main.ts                   # Punto de entrada (Puerto 3000)
│   │   ├── app.module.ts             # Módulo raíz
│   │   ├── app.controller.ts         # Controlador raíz
│   │   ├── app.service.ts            # Servicio raíz
│   │   │
│   │   ├── config/                   # (Vacío) - Futura config
│   │   │
│   │   ├── database/                 # (Vacío) - Futura config DB
│   │   │
│   │   ├── modules/
│   │   │   ├── identity/             # Gestión de Usuarios
│   │   │   │   ├── identity.module.ts
│   │   │   │   ├── identity.service.ts
│   │   │   │   └── entities/
│   │   │   │       └── user.entity.ts
│   │   │   │
│   │   │   ├── reports/              # Ingesta y Gestión de Reportes
│   │   │   │   ├── reports.module.ts
│   │   │   │   ├── reports.service.ts
│   │   │   │   ├── reports.controller.ts
│   │   │   │   ├── entities/
│   │   │   │   │   ├── report.entity.ts
│   │   │   │   │   └── official-history.entity.ts
│   │   │   │   └── dto/
│   │   │   │       └── create-report.dto.ts
│   │   │   │
│   │   │   └── validation/           # Procesamiento Asíncrono (Queue Worker)
│   │   │       ├── validation.module.ts
│   │   │       └── validation.processor.ts
│   │   │
│   │   ├── common/                   # (Vacío) - Guards, Interceptors, etc.
│   │   │
│   │   └── app.*.spec.ts            # Tests
│   │
│   └── test/
│       ├── jest-e2e.json
│       └── app.e2e-spec.ts          # Tests E2E
│
└── alertify-frontend/                 # App Android Nativa (Kotlin)
    ├── build.gradle.kts              # Configuración Gradle raíz
    ├── gradle.properties
    ├── settings.gradle.kts
    ├── gradlew, gradlew.bat
    ├── local.properties              # Crear manualmente (Android SDK)
    │
    ├── gradle/
    │   ├── libs.versions.toml       # Versiones centralizadas
    │   └── wrapper/
    │
    ├── app/                          # Módulo principal
    │   ├── build.gradle.kts          # Dependencias y configuración
    │   ├── proguard-rules.pro
    │   │
    │   ├── src/
    │   │   ├── main/
    │   │   │   ├── AndroidManifest.xml
    │   │   │   ├── java/
    │   │   │   │   └── com.alertify.app/
    │   │   │   │       ├── MainActivity.kt
    │   │   │   │       ├── api/         # Retrofit client
    │   │   │   │       ├── ui/          # Actividades y Fragmentos
    │   │   │   │       ├── location/    # Geolocalización
    │   │   │   │       └── firebase/    # Mensajería push
    │   │   │   │
    │   │   │   └── res/
    │   │   │       ├── layout/        # XMLs de interfaz
    │   │   │       ├── menu/          # Menús
    │   │   │       ├── drawable/      # Iconos e imágenes
    │   │   │       └── values/        # Strings, colores, etc.
    │   │   │
    │   │   ├── test/                 # Tests unitarios
    │   │   └── androidTest/          # Tests instrumentados
    │   │
    │   ├── google-services.json      # Config Firebase (crear)
    │   └── build/                     # Artefactos compilados
    │
    └── README.md                      # Documentación del frontend
```

---

## 🔌 Endpoints Disponibles

### **Módulo de Reportes**

#### Crear (ingestar) reporte
```http
POST /reports
Content-Type: application/json

{
  "userId": 1,
  "incidentTypeId": 3,
  "latitude": -0.2193,
  "longitude": -78.4678,
  "description": "Robo en Av. Amazonas y Colón"
}
```

**Respuesta 201 (Éxito):**
```json
{
  "IdReporte": 42,
  "IdUsuario": 1,
  "IdTipoIncidente": 3,
  "UbicacionGeografica": "POINT(-78.4678 -0.2193)",
  "Descripcion": "Robo en Av. Amazonas y Colón",
  "Estado": 0,
  "PuntajeConfianza": 0,
  "FechaHoraRegistro": "2026-02-28T10:30:00.000Z"
}
```

**Respuesta 400 (Fuera de zona):**
```json
{
  "statusCode": 400,
  "message": "El incidente se encuentra fuera de la zona de cobertura (Quito)."
}
```

#### Obtener reportes validados
```http
GET /reports/validated
```

**Respuesta 200:**
```json
[
  {
    "id": 42,
    "description": "Robo en Av. Amazonas y Colón",
    "latitude": -0.2193,
    "longitude": -78.4678
  },
  {
    "id": 43,
    "description": "Accidente de tránsito",
    "latitude": -0.2150,
    "longitude": -78.4700
  }
]
```

### **Estado de Colas**

#### Monitorear procesamiento
```
GET http://localhost:3000/admin/queues
```

Visualiza:
- Trabajos pendientes
- Trabajos en progreso
- Trabajos completados
- Trabajos fallidos

---

## 🧪 Testing

### **Backend**

```bash
cd alertify-backend

# Tests unitarios
npm run test

# Con coverage
npm run test:cov

# Tests E2E
npm run test:e2e

# Watch mode (desarrollo)
npm run test:watch
```

### **Frontend**

En Android Studio:
1. **Right-click en `src/test`** → **Run Tests**
2. Para tests instrumentados: **Right-click en `src/androidTest`** → **Run Android Tests**

---

## 🚨 Troubleshooting

### **Backend no puede conectar a SQL Server**
```bash
# SQL Server tarda ~60s en estar listo

# Verificar que Docker esté corriendo
docker ps

# Ver logs de SQL Server
docker logs alertify-backend-sqlserver-1

# Reiniciar servicios
docker-compose restart
```

### **Puerto 3000 ya en uso**
```bash
# Matar proceso en puerto 3000
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# macOS/Linux:
lsof -ti:3000 | xargs kill -9
```

### **Gradle sync falla en Android Studio**
```bash
cd alertify-frontend

# Limpiar caché
./gradlew clean

# Reconstruir
./gradlew build --refresh-dependencies
```

### **Firebase credentials no encontradas**
1. Descarga `google-services.json` desde [Firebase Console](https://console.firebase.google.com)
2. Colócalo en `alertify-frontend/app/`
3. Ejecuta `./gradlew build`

---

## 📊 Monitoreo y Debugging

### **Logs de Backend**
```bash
# Ver logs en tiempo real
docker logs -f alertify-backend-sqlserver-1
docker logs -f alertify-backend-redis-1

# Ver logs de la aplicación
npm run start:dev
```

### **Base de Datos**

Conectarse a SQL Server:
```bash
# Con SQL Server Management Studio (Windows)
Server: localhost,1433
User: sa
Password: Alertify_Pass2026!
Database: AlertifyDB

# O desde terminal (si tienes sqlcmd)
sqlcmd -S localhost,1433 -U sa -P "Alertify_Pass2026!"
```

Consultas útiles:
```sql
-- Ver todos los reportes
SELECT IdReporte, IdUsuario, Estado, PuntajeConfianza, FechaHoraRegistro
FROM REPORTES_CIUDADANOS
ORDER BY FechaHoraRegistro DESC;

-- Reportes validados
SELECT * FROM REPORTES_CIUDADANOS WHERE Estado = 1;

-- Score de usuarios
SELECT IdUsuario, Email, PuntajeReputacion FROM USUARIOS;
```

### **Redis**
```bash
# Conectar a Redis CLI
docker exec -it alertify-backend-redis-1 redis-cli

# Ver claves
KEYS *

# Ver contenido de cola
LRANGE bull:report-validation:* 0 -1
```

---

## 🤝 Contribuir

1. **Fork el proyecto**
2. **Crea una rama nueva** (`git checkout -b feature/nueva-funcionalidad`)
3. **Commitea cambios** (`git commit -m 'Agregar nueva funcionalidad'`)
4. **Push a la rama** (`git push origin feature/nueva-funcionalidad`)
5. **Abre un Pull Request**

---


## 👥 Autores

Desarrollado por el equipo Alertify.

---

**Última actualización**: 28 de febrero de 2026
