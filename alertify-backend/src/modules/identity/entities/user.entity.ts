import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Report } from '../../reports/entities/report.entity';

@Entity('USUARIOS')
export class User {
  @PrimaryGeneratedColumn()
  IdUsuario: number; // PK - INT [cite: 643, 644]

  @Column({ unique: true })
  Email: string; // VARCHAR [cite: 647, 648]

  @Column()
  Password: string; // VARCHAR (Hashed) [cite: 650, 651]

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 5.0 })
  PuntajeReputacion: number; // DECIMAL [cite: 656, 657]

  // Relación con los reportes creados por el ciudadano
  @OneToMany(() => Report, (report) => report.IdUsuario)
  reports: Report[];
}