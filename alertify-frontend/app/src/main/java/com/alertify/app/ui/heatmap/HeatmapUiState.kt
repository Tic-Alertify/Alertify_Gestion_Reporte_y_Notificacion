package com.alertify.app.ui.heatmap

import com.alertify.app.data.model.HeatmapPoint
import com.alertify.app.data.model.ReportResponse

data class HeatmapUiState(
    val isLoading: Boolean = false,
    val points: List<HeatmapPoint> = emptyList(),
    val recentReports: List<ReportResponse> = emptyList(),
    val error: String? = null
)