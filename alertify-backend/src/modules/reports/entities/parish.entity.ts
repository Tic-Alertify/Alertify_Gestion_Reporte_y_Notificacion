import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  Index,
} from 'typeorm';

/**
 * Entidad que representa las parroquias con sus coordenadas geográficas
 * Se cruza con los reportes del ECU911 para enriquecer con ubicación
 * La normalización se hace EN MEMORIA, no se almacena
 */
@Entity('PARROQUIAS')
@Index(['Nombre'], { unique: false })
export class Parish {
  @PrimaryGeneratedColumn()
  Id: number;

  /**
   * Nombre de la parroquia (como viene en el Excel)
   * La normalización se hace al comparar
   */
  @Column({ type: 'varchar', length: 255 })
  Nombre: string;

  /**
   * Provincia
   */
  @Column({ type: 'varchar', length: 100 })
  Provincia: string;

  /**
   * Cantón
   */
  @Column({ type: 'varchar', length: 100 })
  Canton: string;

  /**
   * Latitud
   */
  @Column({ type: 'decimal', precision: 10, scale: 8 })
  Latitud: number;

  /**
   * Longitud
   */
  @Column({ type: 'decimal', precision: 11, scale: 8 })
  Longitud: number;

  /**
   * Fecha de carga del registro
   */
  @Column({ type: 'datetime', default: () => 'GETDATE()' })
  FechaRegistro: Date;
}
