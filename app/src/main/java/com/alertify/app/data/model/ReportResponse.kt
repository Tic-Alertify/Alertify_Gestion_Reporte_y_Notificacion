package com.alertify.app.data.model

import com.google.gson.annotations.SerializedName

data class ReportResponse(
    val id: Int,
    @SerializedName("description") val description: String,
    @SerializedName("incidentType") val incidentType: String,
    @SerializedName("latitude") val latitude: Double, // Ya no dará error
    @SerializedName("longitude") val longitude: Double, // Ya no dará error
    @SerializedName("trustScore") val trustScore: Double
)