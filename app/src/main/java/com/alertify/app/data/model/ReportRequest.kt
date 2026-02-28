package com.alertify.app.data.model

data class ReportRequest(
    val userId: Int,          // ID del usuario que reporta [cite: 666]
    val incidentTypeId: Int,  // Tipo de incidente (Robo, asalto, etc.) [cite: 669]
    val latitude: Double,     // Capturado del GPS
    val longitude: Double,    // Capturado del GPS
    val description: String   // Detalles del suceso [cite: 674]
)