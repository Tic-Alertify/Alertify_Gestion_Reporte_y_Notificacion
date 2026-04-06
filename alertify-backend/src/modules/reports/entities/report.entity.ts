import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { IncidentType } from './incident-type.entity';
import { IsInt, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

@Entity('REPORTES_CIUDADANOS') // Nombre exacto de tu tabla [cite: 660]
export class Report {
  @PrimaryGeneratedColumn()
  IdReporte!: number;

  @Column()
  IdUsuario!: number;
  
  @Column()
  IdTipoIncidente!: number;

  @ManyToOne(() => IncidentType, (incidentType) => incidentType.reportes)
  @JoinColumn({ name: 'IdTipoIncidente' })
  tipoIncidente!: IncidentType;

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
    transformer: {
      to(value: { latitude: number; longitude: number } | null) {
        if (!value) return null;
        return `POINT(${value.longitude} ${value.latitude})`;
      },
      from(value: string | null) {
        if (!value) return null;
        // Parsear WKT format: "POINT(lon lat)"
        const match = value.match(/POINT\s*\(\s*([-\d.]+)\s+([-\d.]+)\s*\)/i);
        if (!match) return null;
        return {
          longitude: parseFloat(match[1]),
          latitude: parseFloat(match[2]),
        };
      },
    },
  })
  UbicacionGeografica!: { longitude: number; latitude: number } | null; 

  @Column({ type: 'nvarchar', length: 'MAX', nullable: true })
  Descripcion!: string; 

  @Column({ type: 'tinyint', default: 0 })
  Estado!: number; // 0: Pendiente, 1: Validado [cite: 676, 677]

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 0 })
  PuntajeConfianza!: number; 

  @CreateDateColumn()
  FechaHoraRegistro!: Date; 
}