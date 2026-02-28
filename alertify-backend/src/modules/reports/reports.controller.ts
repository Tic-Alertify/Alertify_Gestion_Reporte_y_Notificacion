// Agregamos 'Get' a los imports
import { Controller, Post, Get, Body, UsePipes, ValidationPipe } from '@nestjs/common'; 
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

@Controller('reports') 
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @UsePipes(new ValidationPipe())
  async createReport(@Body() createReportDto: CreateReportDto) {
    return await this.reportsService.ingestReport(createReportDto);
  }

  // Ahora el servidor sí responderá a la petición GET de Android
  @Get('validated')
  async getValidated() {
    return await this.reportsService.getValidatedReports();
  }
}