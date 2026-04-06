package com.alertify.app.viewmodel

import androidx.lifecycle.*
import com.alertify.app.data.repository.ReportRepository
import com.alertify.app.ui.heatmap.HeatmapUiState
import com.alertify.app.utils.Resource
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class HeatmapViewModel : ViewModel() {

    private val repository = ReportRepository()

    // Única fuente de verdad para la UI [cite: 221, 634]
    private val _uiState = MutableLiveData<HeatmapUiState>(HeatmapUiState())
    val uiState: LiveData<HeatmapUiState> = _uiState

    fun fetchMapData() {
        // 1. Iniciar estado de carga y conectar Socket [cite: 159, 202]
        updateState { it.copy(isLoading = true, error = null) }
        repository.initSocket()

        // --- BLOQUE A: Carga de Heatmap (HTTP)
        viewModelScope.launch {
            repository.getHeatmapData(365).collect { resource ->
                when (resource) {
                    is Resource.Success -> updateState { it.copy(points = resource.data, isLoading = false) }
                    is Resource.Error -> updateState { it.copy(error = resource.message, isLoading = false) }
                    is Resource.Loading -> updateState { it.copy(isLoading = true) }
                }
            }
        }

        // --- BLOQUE B: Carga de Reportes Recientes (HTTP)
        viewModelScope.launch {
            repository.getValidatedReports().collect { resource ->
                if (resource is Resource.Success) {
                    val weekAgo = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000)
                    val filtered = resource.data.filter {
                        parseDate(it.createdAt) > weekAgo
                    }
                    updateState { it.copy(recentReports = filtered) }
                }
            }
        }

        // --- BLOQUE C: Escucha en Tiempo Real (WebSocket)
        viewModelScope.launch {
            repository.listenToLiveReports().collect { liveReport ->
                val state = _uiState.value ?: HeatmapUiState()
                val currentReports = state.recentReports

                // Blindaje contra duplicados para evitar parpadeo en el mapa
                if (currentReports.none { it.id == liveReport.id }) {
                    val updatedList = listOf(liveReport) + currentReports
                    updateState { it.copy(recentReports = updatedList) }
                }
            }
        }
    }

    /**
     * Actualiza el estado de forma atómica y segura entre hilos.
     */
    private fun updateState(transform: (HeatmapUiState) -> HeatmapUiState) {
        val currentState = _uiState.value ?: HeatmapUiState()
        _uiState.postValue(transform(currentState))
    }

    /**
     * Parsea fechas ISO 8601 provenientes de NestJS[cite: 77, 445].
     */
    private fun parseDate(dateStr: String?): Long {
        return try {
            val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US)
            sdf.timeZone = TimeZone.getTimeZone("UTC")
            sdf.parse(dateStr ?: "")?.time ?: 0L
        } catch (e: Exception) { 0L }
    }
}