# 📊 Diagramas de Base de Datos - Alertify

## Diagrama Entidad-Relación (ER)

```mermaid
erDiagram
    USUARIOS ||--o{ REPORTES_CIUDADANOS : "crea"
    TIPOS_INCIDENTE ||--o{ REPORTES_CIUDADANOS : "clasifica"
    TIPOS_INCIDENTE ||--o{ HISTORIAL_OFICIAL_INCIDENTES : "contiene"
    PARROQUIAS ||--o{ HISTORIAL_OFICIAL_INCIDENTES : "referencia"

    USUARIOS {
        int IdUsuario PK
        string Email UK
        string Password
        decimal PuntajeReputacion
        string FcmToken "nullable"
        geography UbicacionActual "nullable"
        datetime FechaUltimaUbicacion "nullable"
        datetime FechaCreacion
        datetime FechaModificacion "nullable"
    }

    REPORTES_CIUDADANOS {
        int IdReporte PK
        int IdUsuario FK
        int IdTipoIncidente FK
        geography UbicacionGeografica
        string Descripcion "nullable"
        tinyint Estado "0:Pendiente,1:Validado"
        decimal PuntajeConfianza
        datetime FechaHoraRegistro
        datetime FechaValidacion "nullable"
        datetime FechaModificacion "nullable"
    }

    TIPOS_INCIDENTE {
        int IdTipoIncidente PK
        string Nombre UK
        string Descripcion "nullable"
        datetime FechaCreacion
    }

    HISTORIAL_OFICIAL_INCIDENTES {
        int IdHistorial PK
        string IdExterno UK
        int IdTipoIncidente FK
        geography UbicacionGeografica
        datetime FechaHoraOcurrencia
        datetime FechaHoraCarga
        string Provincia
        string Canton
        string Parroquia
        string Descripcion
        string NumeroEmergencia
        datetime FechaModificacion
    }

    PARROQUIAS {
        int Id PK
        string Nombre UK
        string Provincia
        string Canton
        decimal Latitud
        decimal Longitud
        datetime FechaRegistro
    }
```

---

## Arquitectura de Tablas con Detalles Completos

```mermaid
graph TB
    subgraph USUARIOS["👤 USUARIOS"]
        U["<b>Campos Principales:</b><br/>━━━━━━━━━━━━━━━━<br/>🔑 IdUsuario (INT) - PK<br/>📧 Email (NVARCHAR) - UK<br/>🔐 Password (NVARCHAR)<br/>⭐ PuntajeReputacion (DECIMAL)<br/>━━━━━━━━━━━━━━━━<br/><b>Sprint 4 - Ubicación Real:</b><br/>📱 FcmToken (NVARCHAR)<br/>📍 UbicacionActual (GEOGRAPHY)<br/>🕐 FechaUltimaUbicacion (DATETIME)<br/>━━━━━━━━━━━━━━━━<br/><b>Auditoría:</b><br/>✓ FechaCreacion<br/>✓ FechaModificacion"]
    end

    subgraph REPORTES["📋 REPORTES_CIUDADANOS"]
        R["<b>Campos Principales:</b><br/>━━━━━━━━━━━━━━━━<br/>🔑 IdReporte (INT) - PK<br/>👤 IdUsuario (INT) - FK<br/>🏷️ IdTipoIncidente (INT) - FK<br/>━━━━━━━━━━━━━━━━<br/><b>Datos Espaciales:</b><br/>📍 UbicacionGeografica (GEOGRAPHY)<br/>━━━━━━━━━━━━━━━━<br/><b>Validación:</b><br/>📝 Descripcion (NVARCHAR)<br/>📊 Estado (TINYINT: 0/1)<br/>💯 PuntajeConfianza (DECIMAL)<br/>━━━━━━━━━━━━━━━━<br/><b>Timestamps:</b><br/>⏱️ FechaHoraRegistro<br/>✓ FechaValidacion<br/>✓ FechaModificacion"]
    end

    subgraph TIPOS["🏷️ TIPOS_INCIDENTE"]
        T["<b>Catálogo Maestro:</b><br/>━━━━━━━━━━━━━━━━<br/>🔑 IdTipoIncidente (INT) - PK<br/>📌 Nombre (NVARCHAR) - UK<br/>📖 Descripcion (NVARCHAR)<br/>━━━━━━━━━━━━━━━━<br/>~8-10 tipos predefinidos<br/>(Robo, Accidente, etc)"]
    end

    subgraph OFICIAL["🚨 HISTORIAL_OFICIAL"]
        O["<b>Datos ECU911:</b><br/>━━━━━━━━━━━━━━━━<br/>🔑 IdHistorial (INT) - PK<br/>🔗 IdExterno (VARCHAR) - UK<br/>━━━━━━━━━━━━━━━━<br/><b>Clasificación:</b><br/>🏷️ IdTipoIncidente (INT) - FK<br/>━━━━━━━━━━━━━━━━<br/><b>Ubicación:</b><br/>📍 UbicacionGeografica (GEOGRAPHY)<br/>━━━━━━━━━━━━━━━━<br/><b>Timestamps:</b><br/>⏱️ FechaHoraOcurrencia<br/>📥 FechaHoraCarga<br/>━━━━━━━━━━━━━━━━<br/><b>Metadata:</b><br/>📍 Provincia, Canton, Parroquia<br/>📝 Descripcion"]
    end

    subgraph PARROQUIAS["🗺️ PARROQUIAS"]
        P["<b>Referencia Geográfica:</b><br/>━━━━━━━━━━━━━━━━<br/>🔑 Id (INT) - PK<br/>📌 Nombre (VARCHAR) - UK<br/>📍 Latitud (DECIMAL)<br/>📍 Longitud (DECIMAL)<br/>━━━━━━━━━━━━━━━━<br/><b>Ubicación Administrative:</b><br/>🏘️ Provincia (VARCHAR)<br/>🏘️ Canton (VARCHAR)<br/>━━━━━━━━━━━━━━━━<br/>~200-500 registros<br/>(Ecuador)"]
    end

    U -->|"1:N"| R
    T -->|"1:N"| R
    T -->|"1:N"| O
    P -.->|"Referencia"| O

    style USUARIOS fill:#e3f2fd,stroke:#1565c0,stroke-width:2px,color:#000
    style REPORTES fill:#f3e5f5,stroke:#6a1b9a,stroke-width:2px,color:#000
    style TIPOS fill:#fff3e0,stroke:#e65100,stroke-width:2px,color:#000
    style OFICIAL fill:#ffebee,stroke:#b71c1c,stroke-width:2px,color:#000
    style PARROQUIAS fill:#e0f2f1,stroke:#004d40,stroke-width:2px,color:#000
```

---

## Flujo de Datos en la Base de Datos

```mermaid
graph LR
    A["📱 App Móvil<br/>Usuario Activa GPS"]
    
    B["🔵 API: PATCH /users/:id/location<br/>lat, lon"]
    
    C["✅ Actualiza<br/>USUARIOS.UbicacionActual"]
    
    D["📱 Usuario Crea Reporte<br/>POST /reports<br/>lat, lon, tipo, desc"]
    
    E["✅ Inserta<br/>REPORTES_CIUDADANOS<br/>Estado=0 Pendiente"]
    
    F["⚙️ Evento: report:created<br/>→ Cola 'report-validation'"]
    
    G["🟠 ValidationProcessor<br/>- Algoritmo Confianza<br/>- Analiza datos históricos<br/>- STDistance queries"]
    
    H["🔍 Busca en<br/>HISTORIAL_OFICIAL_INCIDENTES<br/>Tipo similar, zona, tiempo"]
    
    I["✅ Actualiza<br/>REPORTES_CIUDADANOS<br/>Estado=1, Confianza=X%"]
    
    J["⚙️ Evento: alert:dispatch<br/>→ Cola 'alert-dispatch'"]
    
    K["🟠 AlertsProcessor<br/>- sp_ObtenerUsuariosCercanos<br/>- STDistance a usuarios"]
    
    L["🔍 Busca en USUARIOS<br/>UbicacionActual STDistance"]
    
    M["📱 Firebase FCM<br/>Envía push notifications"]
    
    N["📱 Usuarios Cercanos<br/>Reciben alerta"]

    A --> B
    B --> C
    D --> E
    E --> F
    F --> G
    G --> H
    H --> I
    I --> J
    J --> K
    K --> L
    L --> M
    M --> N

    style C fill:#90EE90,stroke:#228B22
    style E fill:#90EE90,stroke:#228B22
    style I fill:#90EE90,stroke:#228B22
    style H fill:#FFB6C1,stroke:#DC143C
    style L fill:#FFB6C1,stroke:#DC143C
```

---

## Diagrama de Índices Espaciales

```mermaid
graph TB
    subgraph SPATIAL["🗺️ ÍNDICES GEOESPACIALES"]
        SP1["USUARIOS.UbicacionActual<br/>SPATIAL INDEX<br/>SRID: 4326 WGS84"]
        SP2["REPORTES.UbicacionGeografica<br/>SPATIAL INDEX<br/>SRID: 4326 WGS84"]
        SP3["HISTORIAL.UbicacionGeografica<br/>SPATIAL INDEX<br/>SRID: 4326 WGS84"]
    end

    subgraph QUERIES["🔍 QUERIES ESPACIALES"]
        Q1["STDistance()<br/>Usuarios cercanos<br/>a X metros"]
        Q2["STIntersects()<br/>Reportes en zona"]
        Q3["STBuffer()<br/>Zona de influencia"]
        Q4["STDwithin()<br/>Búsqueda de proximidad"]
    end

    subgraph PERFORMANCE["⚡ OPTIMIZACIONES"]
        P1["Índices SPATIAL<br/>permiten búsquedas<br/>O(log n)"]
        P2["Geography vs Geometry<br/>Curvatura de tierra"]
        P3["Queries paralelas<br/>Multi-core support"]
    end

    SP1 --> Q1
    SP2 --> Q1
    SP3 --> Q1
    SP2 --> Q2
    SP2 --> Q3
    SP1 --> Q4
    Q1 --> P1
    Q2 --> P2
    Q3 --> P3

    style SPATIAL fill:#ffffcc,stroke:#ff9900,stroke-width:2px
    style QUERIES fill:#fff3e0,stroke:#e65100,stroke-width:2px
    style PERFORMANCE fill:#e0f2f1,stroke:#00897b,stroke-width:2px
```

---

## Matriz de Índices por Tabla

```mermaid
graph LR
    subgraph IDX["Índices por Tabla"]
        U["<b>USUARIOS</b><br/>━━━━━━━━━━━━━━━━<br/>🔑 IdUsuario (PK)<br/>🔓 Email (UNIQUE)<br/>🗺️ UbicacionActual (SPATIAL)<br/>━<br/>3 índices"]
        
        R["<b>REPORTES</b><br/>━━━━━━━━━━━━━━━━<br/>🔑 IdReporte (PK)<br/>👤 IdUsuario (FK)<br/>🏷️ IdTipoIncidente (FK)<br/>📊 Estado (FILTER)<br/>🗓️ FechaHoraRegistro<br/>🗺️ UbicacionGeografica (SPATIAL)<br/>━<br/>Composite:<br/>- (IdUsuario, Fecha)<br/>- (Estado, Fecha)<br/>━<br/>7 índices"]
        
        H["<b>HISTORIAL</b><br/>━━━━━━━━━━━━━━━━<br/>🔑 IdHistorial (PK)<br/>🔗 IdExterno (UNIQUE)<br/>🏷️ IdTipoIncidente (FK)<br/>🗓️ FechaHoraOcurrencia<br/>🗺️ UbicacionGeografica (SPATIAL)<br/>━<br/>Composite:<br/>- (TipoIncidente, Fecha)<br/>━<br/>5 índices"]
        
        P["<b>PARROQUIAS</b><br/>━━━━━━━━━━━━━━━━<br/>🔑 Id (PK)<br/>📌 Nombre (UNIQUE)<br/>━<br/>Composite:<br/>- (Provincia, Canton)<br/>━<br/>3 índices"]
    end

    style U fill:#e3f2fd,stroke:#1565c0
    style R fill:#f3e5f5,stroke:#6a1b9a
    style H fill:#ffebee,stroke:#b71c1c
    style P fill:#e0f2f1,stroke:#004d40
```

---

## Ciclo de Vida de un Reporte

```mermaid
stateDiagram-v2
    [*] --> Creacion: Usuario envía<br/>POST /reports
    
    Creacion --> EnCola: INSERT REPORTES<br/>Estado=0 Pendiente
    
    EnCola --> Validacion: report:created<br/>→ 'report-validation' queue
    
    Validacion --> Procesando: ValidationProcessor<br/>recibe evento
    
    Procesando --> AnalisisHistorico: Calcula<br/>PuntajeConfianza
    
    AnalisisHistorico --> ActualizacionBD: UPDATE REPORTES<br/>Estado=1, Confianza=X%
    
    ActualizacionBD --> AlertasEnCola: alert:dispatch<br/>→ 'alert-dispatch' queue
    
    AlertasEnCola --> ProcesandoAlertas: AlertsProcessor<br/>recibe evento
    
    ProcesandoAlertas --> BusquedaUsuarios: STDistance Query<br/>Usuarios cercanos
    
    BusquedaUsuarios --> NotificacionesPush: sp_ObtenerUsuariosCercanos<br/>Firebase FCM
    
    NotificacionesPush --> Completado: Usuarios reciben<br/>notificación
    
    Completado --> [*]

    note right of Creacion
        REPORTES_CIUDADANOS
        Estado = 0
    end note
    
    note right of Validacion
        Redis Queue:
        report-validation
    end note
    
    note right of AnalisisHistorico
        Queries HISTORIAL_OFICIAL
        STDistance()
    end note
    
    note right of ActualizacionBD
        REPORTES_CIUDADANOS
        Estado = 1
    end note
    
    note right of BusquedaUsuarios
        Queries USUARIOS
        STDistance()
    end note
```

---

## Comparación: Reportes Ciudadanos vs Históricos

```mermaid
graph TB
    subgraph CIUDADANOS["📋 REPORTES_CIUDADANOS"]
        RC["Tiempo Real<br/>2-5 minutos<br/>Generado por usuario<br/>Requiere validación<br/>~100K-500K diarios"]
    end

    subgraph OFICIAL["🚨 HISTORIAL_OFICIAL"]
        HO["Histórico<br/>ECU911<br/>Importación periódica<br/>Ya validado<br/>~1M-10M registros"]
    end

    subgraph COMPARACION["🔄 VALIDACIÓN CRUZADA"]
        CMP["<b>En ValidationProcessor:</b><br/>1. Obtener tipo incidente<br/>2. Buscar en HISTORIAL<br/>   - Mismo tipo<br/>   - Zona cercana<br/>   - Últimas 2 horas<br/>3. Calcular confianza<br/>4. Actualizar reporte"]
    end

    RC --> CMP
    HO --> CMP

    style CIUDADANOS fill:#f3e5f5,stroke:#6a1b9a
    style OFICIAL fill:#ffebee,stroke:#b71c1c
    style COMPARACION fill:#fff9c4,stroke:#f57f17,stroke-width:2px
```

---

## Schema SQL Simplificado

```sql
-- USUARIOS: Identidad + Ubicación
USUARIOS
├── IdUsuario (PK)
├── Email (UNIQUE)
├── PuntajeReputacion
└── UbicacionActual (GEOGRAPHY SPATIAL)

-- REPORTES: Datos Ciudadanos
REPORTES_CIUDADANOS
├── IdReporte (PK)
├── IdUsuario (FK → USUARIOS)
├── IdTipoIncidente (FK → TIPOS_INCIDENTE)
├── UbicacionGeografica (GEOGRAPHY SPATIAL)
├── Estado (0=Pendiente, 1=Validado)
└── PuntajeConfianza

-- TIPOS_INCIDENTE: Catálogo
TIPOS_INCIDENTE
├── IdTipoIncidente (PK)
└── Nombre (UNIQUE)

-- HISTORIAL_OFICIAL_INCIDENTES: Datos ECU911
HISTORIAL_OFICIAL_INCIDENTES
├── IdHistorial (PK)
├── IdExterno (UNIQUE)
├── IdTipoIncidente (FK)
├── UbicacionGeografica (GEOGRAPHY SPATIAL)
└── FechaHoraOcurrencia

-- PARROQUIAS: Referencia Geográfica
PARROQUIAS
├── Id (PK)
├── Nombre (UNIQUE)
├── Latitud
└── Longitud
```

---

## Ejemplos de Queries Principales

### 1. Usuarios Cercanos a un Reporte (5km)
```mermaid
graph LR
    A["Reporte en<br/>-0.22, -78.51"] --> B["STDistance()<br/>5000 metros"]
    B --> C["SELECT USUARIOS<br/>UbicacionActual.STDistance<br/>≤ 5000"]
    C --> D["Resultado:<br/>50-200 usuarios"]
```

### 2. Validación de Reporte
```mermaid
graph LR
    A["Reporte Nuevo<br/>Tipo: Robo<br/>Ubicación: X"] --> B["Buscar HISTORIAL<br/>mismo tipo, zona, -2h"]
    B --> C["Calcular<br/>Confianza %"]
    C --> D["UPDATE<br/>Estado=1<br/>Confianza=75%"]
```

### 3. Ingesta de Datos Históricos
```mermaid
graph LR
    A["CSV ECU911<br/>(historicos)"] --> B["ETL Module<br/>XLSX Parser"]
    B --> C["Transform<br/>Formato Standard"]
    C --> D["INSERT BULK<br/>HISTORIAL_OFICIAL"]
    D --> E["1M registros<br/>cargados"]
```

---

## Matriz de Relaciones y Cascadas

| Tabla | Foreign Key | Referencia | On Delete | On Update |
|-------|---|---|---|---|
| REPORTES_CIUDADANOS | IdUsuario | USUARIOS.IdUsuario | RESTRICT | CASCADE |
| REPORTES_CIUDADANOS | IdTipoIncidente | TIPOS_INCIDENTE.IdTipoIncidente | RESTRICT | CASCADE |
| HISTORIAL_OFICIAL_INCIDENTES | IdTipoIncidente | TIPOS_INCIDENTE.IdTipoIncidente | RESTRICT | CASCADE |

---

## Estadísticas de Cardinality

| Tabla | Registros Iniciales | Crecimiento Diario | Índices |
|-------|---|---|---|
| USUARIOS | 0 | 100-1000 | 3 |
| TIPOS_INCIDENTE | 10 | 0 | 1 |
| REPORTES_CIUDADANOS | 0 | 50K-500K | 7 |
| HISTORIAL_OFICIAL_INCIDENTES | 1M+ | 1K-10K | 5 |
| PARROQUIAS | 200-500 | 0 | 3 |

