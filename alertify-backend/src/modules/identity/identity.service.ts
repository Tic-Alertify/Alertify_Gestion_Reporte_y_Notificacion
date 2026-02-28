import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './entities/user.entity';

@Injectable()
export class IdentityService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  // Método crucial para el Algoritmo de Confianza (T17)
  async getUserReputation(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({ where: { IdUsuario: userId } });
    if (!user) throw new NotFoundException('Usuario no encontrado');
    
    return user.PuntajeReputacion;
  }

  // Actualiza la reputación tras una validación exitosa o un reporte falso
  async updateReputation(userId: number, points: number): Promise<void> {
    const user = await this.userRepository.findOne({ where: { IdUsuario: userId } });
    if (user) {
      user.PuntajeReputacion += points;
      // Limitar entre 0 y 10 para normalizar el algoritmo
      user.PuntajeReputacion = Math.max(0, Math.min(10, user.PuntajeReputacion));
      await this.userRepository.save(user);
    }
  }
}