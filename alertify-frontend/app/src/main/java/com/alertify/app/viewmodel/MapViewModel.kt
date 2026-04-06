package com.alertify.app.viewmodel

import androidx.lifecycle.*
import com.alertify.app.data.model.*
import com.alertify.app.data.repository.ReportRepository
import com.alertify.app.utils.Resource
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class MapViewModel : ViewModel() {
    private val repository = ReportRepository()

    private val _heatmapPoints = MutableLiveData<Resource<List<HeatmapPoint>>>()
    val heatmapPoints: LiveData<Resource<List<HeatmapPoint>>> = _heatmapPoints

    private val _recentReports = MutableLiveData<List<ReportResponse>>()
    private val _userReports = MutableLiveData<List<ReportResponse>>()
    val userReportsList: LiveData<List<ReportResponse>> = _userReports

    val allMarkersToDraw = MediatorLiveData<List<ReportResponse>>().apply {
        addSource(_recentReports) { value = (it + (_userReports.value ?: emptyList())).distinctBy { r -> r.id } }
        addSource(_userReports) { value = (it + (_recentReports.value ?: emptyList())).distinctBy { r -> r.id } }
    }

    fun loadAllMapData(userId: Int) {
        viewModelScope.launch {
            repository.getHeatmapData(365).collect { _heatmapPoints.value = it }
            repository.getValidatedReports().collect { resource ->
                if (resource is Resource.Success) {
                    val weekAgo = System.currentTimeMillis() - (7 * 24 * 60 * 60 * 1000)
                    _recentReports.value = resource.data.filter { parseIsoDate(it.createdAt) > weekAgo }
                }
            }
            loadUserHistory(userId)
        }
    }

    fun loadUserHistory(userId: Int) {
        viewModelScope.launch {
            val result = repository.getReportsByUser(userId)
            if (result is Resource.Success) _userReports.value = result.data ?: emptyList()
        }
    }

    private fun parseIsoDate(dateStr: String?): Long {
        return try {
            SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }.parse(dateStr ?: "")?.time ?: 0
        } catch (e: Exception) { 0L }
    }
}