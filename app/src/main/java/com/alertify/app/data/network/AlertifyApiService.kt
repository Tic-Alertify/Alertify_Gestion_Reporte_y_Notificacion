package com.alertify.app.data.network

import com.alertify.app.data.model.ReportRequest
import com.alertify.app.data.model.ReportResponse
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST
import retrofit2.http.GET
interface AlertifyApiService {
    // Tarea T04: Endpoint para recibir el reporte [cite: 585, 615]
    @POST("reports")
    suspend fun createReport(
        @Body request: ReportRequest
    ): Response<Unit>

    // Dentro de AlertifyApiService
    @GET("reports/validated")
    suspend fun getValidatedReports(): Response<List<ReportResponse>>
}