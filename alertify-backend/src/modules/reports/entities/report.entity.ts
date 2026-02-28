import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('REPORTES_CIUDADANOS') // Nombre exacto de tu tabla [cite: 660]
export class Report {
  @PrimaryGeneratedColumn()
  IdReporte: number;

  @Column()
  IdUsuario: number;
  @Column()
  IdTipoIncidente: number; 

  @Column({
    type: 'geography', // Define el tipo espacial de SQL Server 
    spatialFeatureType: 'Point', // El reporte es un punto específico (Lat/Long)
    srid: 4326, // Sistema de coordenadas estándar para GPS (WGS84)
  })
  UbicacionGeografica: string; 

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  Descripcion: string; 

  @Column({ type: 'tinyint', default: 0 })
  Estado: number; // 0: Pendiente, 1: Validado [cite: 676, 677]

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  PuntajeConfianza: number; 

  @CreateDateColumn()
  FechaHoraRegistro: Date; 
}