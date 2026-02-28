import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('HISTORIAL_OFICIAL_INCIDENTES')
export class OfficialHistory {
  @PrimaryGeneratedColumn()
  IdHistorial: number; 

  @Column({ type: 'varchar', length: 50 })
  IdExterno: string; 

  @Column()
  IdTipoIncidente: number; 

  @Column({
    type: 'geography',
    spatialFeatureType: 'Point',
    srid: 4326,
  })
  UbicacionGeografica: string; 

  @Column({ type: 'datetime2' })
  FechaHoraOcurrencia: Date; 
}