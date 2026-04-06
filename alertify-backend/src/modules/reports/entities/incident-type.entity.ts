import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Report } from './report.entity';

@Entity('TIPOS_INCIDENTE')
export class IncidentType {
  @PrimaryGeneratedColumn()
  IdTipoIncidente!: number;

  @Column({ type: 'nvarchar', length: 100 })
  Nombre!: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  Descripcion!: string;

  @OneToMany(() => Report, (report) => report.tipoIncidente)
  reportes!: Report[];
}
