import { IsNumber, IsString, IsNotEmpty } from 'class-validator';

export class CreateReportDto {
  @IsNumber()
  userId: number; // [cite: 643]

  @IsNumber()
  incidentTypeId: number; // [cite: 669]

  @IsNumber()
  latitude: number; // Para convertir a GEOGRAPHY [cite: 671]

  @IsNumber()
  longitude: number;

  @IsString()
  @IsNotEmpty()
  description: string; // [cite: 674]
}