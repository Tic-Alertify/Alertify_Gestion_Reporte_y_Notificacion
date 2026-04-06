import { Controller, Post, Get, Body, UsePipes, ValidationPipe, Query, Param } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CreateReportDto } from './dto/create-report.dto';

/**
 * REST API controller for incident report operations.
 * Exposes endpoints for creating reports and retrieving heatmap data.
 */
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  /**
   * Creates and ingests a new incident report.
   * @param createReportDto Report creation payload with location, type, and description
   * @returns Persisted Report entity with generated ID and timestamp
   */
  @Post()
  @UsePipes(new ValidationPipe())
  async createReport(@Body() createReportDto: CreateReportDto) {
    return await this.reportsService.ingestReport(createReportDto);
  }

  /**
   * Retrieves all validated reports (Estado = 1).
   * @returns Array of Report DTOs with incident type and trust scores
   */
  @Get('validated')
  async getValidated() {
    return await this.reportsService.getValidatedReports();
  }

  /**
   * Heatmap aggregated data with intensity scaled by report frequency.
   * Aggregates multiple reports at same location into a single intensity value.
   * @query daysBack Number of days to lookback (default: 30)
   * @returns Array of aggregated heatmap points with intensity levels
   */
  @Get('heatmap/data')
  async getHeatmapData(@Query('daysBack') daysBack: string = '30') {
    return await this.reportsService.getHeatmapDataWithIntensity(
      parseInt(daysBack, 10),
    );
  }

  /**
   * Individual incident report points for heatmap display.
   * Returns all unique report locations without aggregation.
   * @query daysBack Number of days to lookback (default: 30)
   * @returns Array of Report entities with geographic coordinates
   */
  @Get('heatmap/points')
  async getHeatmapPoints(@Query('daysBack') daysBack: string = '30') {
    return await this.reportsService.getHeatmapPoints(parseInt(daysBack, 10));
  }

  /**
   * Daily aggregated statistics for incident reports.
   * Provides time-series data for report count per day.
   * @query daysBack Number of days to lookback (default: 30)
   * @returns Array with date and report count per day
   */
  @Get('heatmap/daily-stats')
  async getDailyStats(@Query('daysBack') daysBack: string = '30') {
    return await this.reportsService.getDailyStats(parseInt(daysBack, 10));
  }

  /**
   * Test endpoint returning mock heatmap data for client development.
   * Do not use in production monitoring.
   * @returns Fixed set of test points with Quito coordinates
   */
  @Get('heatmap/test')
  async getHeatmapTest() {
    const testPoints = [
      {
        latitude: -0.180653,
        longitude: -78.467834,
        reportCount: 5,
        intensity: 35,
        color: '#FFC107',
        reports: []
      },
      {
        latitude: -0.200,
        longitude: -78.500,
        reportCount: 12,
        intensity: 85,
        color: '#F44336',
        reports: []
      },
      {
        latitude: -0.150,
        longitude: -78.450,
        reportCount: 3,
        intensity: 20,
        color: '#4CAF50',
        reports: []
      },
      {
        latitude: -0.220,
        longitude: -78.480,
        reportCount: 8,
        intensity: 60,
        color: '#FF9800',
        reports: []
      }
    ];

    return {
      points: testPoints,
      totalLocations: testPoints.length,
      totalReports: testPoints.reduce((sum, p) => sum + p.reportCount, 0),
      generatedAt: new Date(),
      isTestData: true,
    };
  }

  /**
   * Spatial clustering of reports with geographic proximity grouping.
   * Groups reports within specified radius and returns aggregated statistics.
   * @query radiusKm Clustering radius in kilometers (default: 0.5)
   * @query daysBack Number of days to lookback (default: 30)
   * @returns Array of clusters with member reports and center coordinates
   */
  @Get('heatmap/clusters')
  async getHeatmapClusters(
    @Query('radiusKm') radiusKm: string = '0.5',
    @Query('daysBack') daysBack: string = '30',
  ) {
    return await this.reportsService.getHeatmapClusters(
      parseFloat(radiusKm),
      parseInt(daysBack, 10),
    );
  }

  /**
   * Retrieves all reports submitted by a specific user.
   * @param userId User identifier
   * @returns Array of Report entities ordered by most recent first
   */
  @Get('user/:userId')
  async findByUserId(@Param('userId') userId: string) {
    return await this.reportsService.getUserReports(+userId);
  }
}