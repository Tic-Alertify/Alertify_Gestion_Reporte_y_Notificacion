-- ============================================================================
-- ALERTIFY - Script SQL Completo
-- Base de Datos: MSSQL Server 2019+
-- Propósito: Crear todas las tablas, índices, stored procedures y vistas
-- ============================================================================

-- ============================================================================
-- 1. TABLA: TIPOS_INCIDENTE (Catálogo Maestro)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name = 'TIPOS_INCIDENTE' AND xtype = 'U')
BEGIN
    CREATE TABLE [dbo].[TIPOS_INCIDENTE] (
        [IdTipoIncidente] INT NOT NULL PRIMARY KEY IDENTITY(1,1),
        [Nombre] NVARCHAR(100) NOT NULL UNIQUE,
        [Descripcion] NVARCHAR(500) NULL,
        [FechaCreacion] DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    PRINT 'Tabla TIPOS_INCIDENTE creada exitosamente';
END
ELSE
    PRINT 'Tabla TIPOS_INCIDENTE ya existe';
GO

-- ============================================================================
-- 2. TABLA: USUARIOS (Identidad + Reputación + Ubicación)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name = 'USUARIOS' AND xtype = 'U')
BEGIN
    CREATE TABLE [dbo].[USUARIOS] (
        [IdUsuario] INT NOT NULL PRIMARY KEY IDENTITY(1,1),
        [Email] NVARCHAR(255) NOT NULL UNIQUE,
        [Password] NVARCHAR(MAX) NOT NULL,
        [PuntajeReputacion] DECIMAL(5, 2) NOT NULL DEFAULT 5.0,
        [FcmToken] NVARCHAR(500) NULL DEFAULT NULL,
        [UbicacionActual] GEOGRAPHY NULL DEFAULT NULL,
        [FechaUltimaUbicacion] DATETIME2 NULL DEFAULT NULL,
        [FechaCreacion] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [FechaModificacion] DATETIME2 NULL,
        
        CONSTRAINT CHK_USUARIOS_REPUTACION CHECK ([PuntajeReputacion] >= 0 AND [PuntajeReputacion] <= 10)
    );
    
    -- Índices para USUARIOS
    CREATE INDEX IDX_USUARIOS_EMAIL ON [dbo].[USUARIOS]([Email]);
    CREATE SPATIAL INDEX SIDX_USUARIOS_UBICACION ON [dbo].[USUARIOS]([UbicacionActual]);
    
    PRINT 'Tabla USUARIOS creada exitosamente con índices';
END
ELSE
    PRINT 'Tabla USUARIOS ya existe';
GO

-- ============================================================================
-- 3. TABLA: REPORTES_CIUDADANOS (Reportes en Tiempo Real)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name = 'REPORTES_CIUDADANOS' AND xtype = 'U')
BEGIN
    CREATE TABLE [dbo].[REPORTES_CIUDADANOS] (
        [IdReporte] INT NOT NULL PRIMARY KEY IDENTITY(1,1),
        [IdUsuario] INT NOT NULL,
        [IdTipoIncidente] INT NOT NULL,
        [UbicacionGeografica] GEOGRAPHY NULL,
        [Descripcion] NVARCHAR(MAX) NULL,
        [Estado] TINYINT NOT NULL DEFAULT 0, -- 0: Pendiente, 1: Validado
        [PuntajeConfianza] DECIMAL(5, 2) NOT NULL DEFAULT 0,
        [FechaHoraRegistro] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [FechaValidacion] DATETIME2 NULL,
        [FechaModificacion] DATETIME2 NULL,
        
        CONSTRAINT FK_REPORTES_USUARIO 
            FOREIGN KEY ([IdUsuario]) REFERENCES [dbo].[USUARIOS]([IdUsuario]),
        CONSTRAINT FK_REPORTES_TIPOINCIDENTE 
            FOREIGN KEY ([IdTipoIncidente]) REFERENCES [dbo].[TIPOS_INCIDENTE]([IdTipoIncidente]),
        CONSTRAINT CHK_REPORTES_ESTADO CHECK ([Estado] IN (0, 1)),
        CONSTRAINT CHK_REPORTES_CONFIANZA CHECK ([PuntajeConfianza] >= 0 AND [PuntajeConfianza] <= 100)
    );
    
    -- Índices para REPORTES_CIUDADANOS
    CREATE INDEX IDX_REPORTES_USUARIO ON [dbo].[REPORTES_CIUDADANOS]([IdUsuario]);
    CREATE INDEX IDX_REPORTES_TIPOINCIDENTE ON [dbo].[REPORTES_CIUDADANOS]([IdTipoIncidente]);
    CREATE INDEX IDX_REPORTES_ESTADO ON [dbo].[REPORTES_CIUDADANOS]([Estado]);
    CREATE INDEX IDX_REPORTES_FECHA ON [dbo].[REPORTES_CIUDADANOS]([FechaHoraRegistro]);
    CREATE INDEX IDX_REPORTES_USUARIO_FECHA ON [dbo].[REPORTES_CIUDADANOS]([IdUsuario], [FechaHoraRegistro]);
    CREATE INDEX IDX_REPORTES_ESTADO_FECHA ON [dbo].[REPORTES_CIUDADANOS]([Estado], [FechaHoraRegistro]);
    CREATE SPATIAL INDEX SIDX_REPORTES_UBICACION ON [dbo].[REPORTES_CIUDADANOS]([UbicacionGeografica]);
    
    PRINT 'Tabla REPORTES_CIUDADANOS creada exitosamente con índices';
END
ELSE
    PRINT 'Tabla REPORTES_CIUDADANOS ya existe';
GO

-- ============================================================================
-- 4. TABLA: HISTORIAL_OFICIAL_INCIDENTES (Datos ECU911)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name = 'HISTORIAL_OFICIAL_INCIDENTES' AND xtype = 'U')
BEGIN
    CREATE TABLE [dbo].[HISTORIAL_OFICIAL_INCIDENTES] (
        [IdHistorial] INT NOT NULL PRIMARY KEY IDENTITY(1,1),
        [IdExterno] VARCHAR(50) NOT NULL UNIQUE,
        [IdTipoIncidente] INT NOT NULL,
        [UbicacionGeografica] GEOGRAPHY NOT NULL,
        [FechaHoraOcurrencia] DATETIME2 NOT NULL,
        [FechaHoraCarga] DATETIME2 NOT NULL DEFAULT GETDATE(),
        [Provincia] NVARCHAR(100) NULL,
        [Canton] NVARCHAR(100) NULL,
        [Parroquia] NVARCHAR(100) NULL,
        [Descripcion] NVARCHAR(MAX) NULL,
        [NumeroEmergencia] VARCHAR(20) NULL,
        [FechaModificacion] DATETIME2 NULL,
        
        CONSTRAINT FK_HISTORIAL_TIPOINCIDENTE 
            FOREIGN KEY ([IdTipoIncidente]) REFERENCES [dbo].[TIPOS_INCIDENTE]([IdTipoIncidente])
    );
    
    -- Índices para HISTORIAL_OFICIAL_INCIDENTES
    CREATE INDEX IDX_HISTORIAL_TIPOINCIDENTE ON [dbo].[HISTORIAL_OFICIAL_INCIDENTES]([IdTipoIncidente]);
    CREATE INDEX IDX_HISTORIAL_FECHA ON [dbo].[HISTORIAL_OFICIAL_INCIDENTES]([FechaHoraOcurrencia]);
    CREATE INDEX IDX_HISTORIAL_IDESXTERNO ON [dbo].[HISTORIAL_OFICIAL_INCIDENTES]([IdExterno]);
    CREATE INDEX IDX_HISTORIAL_TIPOINCIDENTE_FECHA ON [dbo].[HISTORIAL_OFICIAL_INCIDENTES]([IdTipoIncidente], [FechaHoraOcurrencia]);
    CREATE SPATIAL INDEX SIDX_HISTORIAL_UBICACION ON [dbo].[HISTORIAL_OFICIAL_INCIDENTES]([UbicacionGeografica]);
    
    PRINT 'Tabla HISTORIAL_OFICIAL_INCIDENTES creada exitosamente con índices';
END
ELSE
    PRINT 'Tabla HISTORIAL_OFICIAL_INCIDENTES ya existe';
GO

-- ============================================================================
-- 5. TABLA: PARROQUIAS (Referencia Geográfica)
-- ============================================================================
IF NOT EXISTS (SELECT 1 FROM sysobjects WHERE name = 'PARROQUIAS' AND xtype = 'U')
BEGIN
    CREATE TABLE [dbo].[PARROQUIAS] (
        [Id] INT NOT NULL PRIMARY KEY IDENTITY(1,1),
        [Nombre] VARCHAR(255) NOT NULL UNIQUE,
        [Provincia] VARCHAR(100) NOT NULL,
        [Canton] VARCHAR(100) NOT NULL,
        [Latitud] DECIMAL(10, 8) NOT NULL,
        [Longitud] DECIMAL(11, 8) NOT NULL,
        [FechaRegistro] DATETIME2 NOT NULL DEFAULT GETDATE()
    );
    
    -- Índices para PARROQUIAS
    CREATE INDEX IDX_PARROQUIAS_NOMBRE ON [dbo].[PARROQUIAS]([Nombre]);
    CREATE INDEX IDX_PARROQUIAS_PROVINCIA_CANTON ON [dbo].[PARROQUIAS]([Provincia], [Canton]);
    
    PRINT 'Tabla PARROQUIAS creada exitosamente con índices';
END
ELSE
    PRINT 'Tabla PARROQUIAS ya existe';
GO

-- ============================================================================
-- 6. INSERTAR DATOS INICIALES - TIPOS_INCIDENTE
-- ============================================================================
IF (SELECT COUNT(*) FROM [dbo].[TIPOS_INCIDENTE]) = 0
BEGIN
    INSERT INTO [dbo].[TIPOS_INCIDENTE] ([Nombre], [Descripcion])
    VALUES
        (N'Robo', N'Robo a mano armada o asalto'),
        (N'Accidente Tránsito', N'Accidente de tránsito vehicular'),
        (N'Conflicto Social', N'Manifestación, protesta, disturbio'),
        (N'Asalto Comercial', N'Robo a tienda, negocio o banco'),
        (N'Emergencia Médica', N'Solicitud de ambulancia o emergencia médica'),
        (N'Incendio', N'Incendio de estructura o vehículo'),
        (N'Vandalismo', N'Daños a propiedad pública o privada'),
        (N'Pelea Callejera', N'Violencia entre personas'),
        (N'Perdida de Persona', N'Reporte de persona perdida o desaparecida'),
        (N'Robo de Vehículo', N'Sustracción de automóvil o motocicleta');
    
    PRINT 'Datos iniciales de TIPOS_INCIDENTE insertados';
END
ELSE
    PRINT 'TIPOS_INCIDENTE ya contiene datos';
GO

-- ============================================================================
-- 7. STORED PROCEDURES
-- ============================================================================

-- SP: Obtener usuarios cercanos a un reporte
IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'P' AND name = 'sp_ObtenerUsuariosCercanos')
    DROP PROCEDURE sp_ObtenerUsuariosCercanos;
GO

CREATE PROCEDURE [dbo].[sp_ObtenerUsuariosCercanos]
    @Latitud DECIMAL(10, 8),
    @Longitud DECIMAL(11, 8),
    @RadioMetros INT = 5000
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Ubicacion GEOGRAPHY = GEOGRAPHY::Point(@Latitud, @Longitud, 4326);
    
    SELECT 
        [IdUsuario],
        [Email],
        [FcmToken],
        [PuntajeReputacion],
        [UbicacionActual].STDistance(@Ubicacion) AS [DistanciaMetros]
    FROM [dbo].[USUARIOS]
    WHERE [FcmToken] IS NOT NULL
        AND [UbicacionActual] IS NOT NULL
        AND [UbicacionActual].STDistance(@Ubicacion) <= @RadioMetros
    ORDER BY [DistanciaMetros] ASC;
END;
GO

-- SP: Obtener reportes validados en zona
IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'P' AND name = 'sp_ObtenerReportesEnZona')
    DROP PROCEDURE sp_ObtenerReportesEnZona;
GO

CREATE PROCEDURE [dbo].[sp_ObtenerReportesEnZona]
    @Latitud DECIMAL(10, 8),
    @Longitud DECIMAL(11, 8),
    @RadioMetros INT = 1000,
    @UltimosMinutos INT = 60
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @Ubicacion GEOGRAPHY = GEOGRAPHY::Point(@Latitud, @Longitud, 4326);
    DECLARE @FechaLimite DATETIME2 = DATEADD(MINUTE, -@UltimosMinutos, GETDATE());
    
    SELECT 
        r.[IdReporte],
        r.[IdUsuario],
        u.[Email],
        ti.[Nombre] AS [TipoIncidente],
        r.[Descripcion],
        r.[Estado],
        r.[PuntajeConfianza],
        r.[FechaHoraRegistro],
        r.[UbicacionGeografica].STDistance(@Ubicacion) AS [DistanciaMetros]
    FROM [dbo].[REPORTES_CIUDADANOS] r
    INNER JOIN [dbo].[USUARIOS] u ON r.[IdUsuario] = u.[IdUsuario]
    INNER JOIN [dbo].[TIPOS_INCIDENTE] ti ON r.[IdTipoIncidente] = ti.[IdTipoIncidente]
    WHERE r.[UbicacionGeografica] IS NOT NULL
        AND r.[UbicacionGeografica].STDistance(@Ubicacion) <= @RadioMetros
        AND r.[FechaHoraRegistro] >= @FechaLimite
        AND r.[Estado] = 1
    ORDER BY [DistanciaMetros] ASC;
END;
GO

-- SP: Validar reporte con puntaje de confianza
IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'P' AND name = 'sp_ValidarReporte')
    DROP PROCEDURE sp_ValidarReporte;
GO

CREATE PROCEDURE [dbo].[sp_ValidarReporte]
    @IdReporte INT,
    @NuevaConfianza DECIMAL(5, 2)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [dbo].[REPORTES_CIUDADANOS]
    SET 
        [PuntajeConfianza] = @NuevaConfianza,
        [Estado] = 1,
        [FechaValidacion] = GETDATE(),
        [FechaModificacion] = GETDATE()
    WHERE [IdReporte] = @IdReporte;
    
    IF @@ROWCOUNT > 0
        SELECT 'Reporte validado exitosamente' AS [Mensaje];
    ELSE
        SELECT 'Reporte no encontrado' AS [Mensaje];
END;
GO

-- SP: Actualizar ubicación del usuario
IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'P' AND name = 'sp_ActualizarUbicacionUsuario')
    DROP PROCEDURE sp_ActualizarUbicacionUsuario;
GO

CREATE PROCEDURE [dbo].[sp_ActualizarUbicacionUsuario]
    @IdUsuario INT,
    @Latitud DECIMAL(10, 8),
    @Longitud DECIMAL(11, 8)
AS
BEGIN
    SET NOCOUNT ON;
    
    UPDATE [dbo].[USUARIOS]
    SET 
        [UbicacionActual] = GEOGRAPHY::Point(@Latitud, @Longitud, 4326),
        [FechaUltimaUbicacion] = GETDATE(),
        [FechaModificacion] = GETDATE()
    WHERE [IdUsuario] = @IdUsuario;
    
    IF @@ROWCOUNT > 0
        SELECT 'Ubicación actualizada' AS [Mensaje];
    ELSE
        SELECT 'Usuario no encontrado' AS [Mensaje];
END;
GO

-- SP: Crear nuevo reporte
IF EXISTS (SELECT 1 FROM sys.objects WHERE type = 'P' AND name = 'sp_CrearReporte')
    DROP PROCEDURE sp_CrearReporte;
GO

CREATE PROCEDURE [dbo].[sp_CrearReporte]
    @IdUsuario INT,
    @IdTipoIncidente INT,
    @Latitud DECIMAL(10, 8),
    @Longitud DECIMAL(11, 8),
    @Descripcion NVARCHAR(MAX)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @IdReporteNuevo INT;
    
    INSERT INTO [dbo].[REPORTES_CIUDADANOS] 
        ([IdUsuario], [IdTipoIncidente], [UbicacionGeografica], [Descripcion], [Estado])
    VALUES 
        (@IdUsuario, @IdTipoIncidente, GEOGRAPHY::Point(@Longitud, @Latitud, 4326), @Descripcion, 0);
    
    SET @IdReporteNuevo = SCOPE_IDENTITY();
    
    SELECT @IdReporteNuevo AS [IdReporte], 'Reporte creado exitosamente' AS [Mensaje];
END;
GO

-- ============================================================================
-- 8. VISTAS
-- ============================================================================

-- Vista: Reportes con información completa
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'vw_ReportesCompleto')
    DROP VIEW vw_ReportesCompleto;
GO

CREATE VIEW [dbo].[vw_ReportesCompleto] AS
SELECT 
    r.[IdReporte],
    r.[IdUsuario],
    u.[Email],
    u.[PuntajeReputacion],
    ti.[IdTipoIncidente],
    ti.[Nombre] AS [TipoIncidente],
    r.[Descripcion],
    r.[Estado],
    CASE r.[Estado] WHEN 0 THEN 'Pendiente' WHEN 1 THEN 'Validado' END AS [EstadoTexto],
    r.[PuntajeConfianza],
    r.[FechaHoraRegistro],
    r.[FechaValidacion],
    CAST(r.[UbicacionGeografica].Lat AS DECIMAL(10,6)) AS [Latitud],
    CAST(r.[UbicacionGeografica].Long AS DECIMAL(11,6)) AS [Longitud]
FROM [dbo].[REPORTES_CIUDADANOS] r
INNER JOIN [dbo].[USUARIOS] u ON r.[IdUsuario] = u.[IdUsuario]
INNER JOIN [dbo].[TIPOS_INCIDENTE] ti ON r.[IdTipoIncidente] = ti.[IdTipoIncidente];
GO

-- Vista: Estadísticas de incidentes
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'vw_EstadisticasIncidentes')
    DROP VIEW vw_EstadisticasIncidentes;
GO

CREATE VIEW [dbo].[vw_EstadisticasIncidentes] AS
SELECT 
    ti.[Nombre] AS [TipoIncidente],
    COUNT(r.[IdReporte]) AS [TotalReportes],
    SUM(CASE WHEN r.[Estado] = 0 THEN 1 ELSE 0 END) AS [ReportesPendientes],
    SUM(CASE WHEN r.[Estado] = 1 THEN 1 ELSE 0 END) AS [ReportesValidados],
    CAST(
        100.0 * SUM(CASE WHEN r.[Estado] = 1 THEN 1 ELSE 0 END) / NULLIF(COUNT(r.[IdReporte]), 0) 
        AS DECIMAL(5,2)
    ) AS [PorcentajeValidacion],
    CAST(AVG(r.[PuntajeConfianza]) AS DECIMAL(5,2)) AS [ConfianzaPromedio],
    MAX(r.[FechaHoraRegistro]) AS [UltimoReporte]
FROM [dbo].[REPORTES_CIUDADANOS] r
INNER JOIN [dbo].[TIPOS_INCIDENTE] ti ON r.[IdTipoIncidente] = ti.[IdTipoIncidente]
GROUP BY ti.[Nombre];
GO

-- Vista: Usuarios más activos
IF EXISTS (SELECT 1 FROM sys.views WHERE name = 'vw_UsuariosMasActivos')
    DROP VIEW vw_UsuariosMasActivos;
GO

CREATE VIEW [dbo].[vw_UsuariosMasActivos] AS
SELECT TOP 100
    u.[IdUsuario],
    u.[Email],
    u.[PuntajeReputacion],
    COUNT(r.[IdReporte]) AS [TotalReportes],
    SUM(CASE WHEN r.[Estado] = 1 THEN 1 ELSE 0 END) AS [ReportesValidados],
    CAST(AVG(r.[PuntajeConfianza]) AS DECIMAL(5,2)) AS [ConfianzaPromedio],
    MAX(r.[FechaHoraRegistro]) AS [UltimoReporte]
FROM [dbo].[USUARIOS] u
LEFT JOIN [dbo].[REPORTES_CIUDADANOS] r ON u.[IdUsuario] = r.[IdUsuario]
GROUP BY u.[IdUsuario], u.[Email], u.[PuntajeReputacion]
ORDER BY [TotalReportes] DESC;
GO

PRINT 'Base de datos ALERTIFY creada exitosamente!';
PRINT 'Tablas: 5 ✓';
PRINT 'Índices: 20+ ✓';
PRINT 'Stored Procedures: 5 ✓';
PRINT 'Vistas: 3 ✓';
