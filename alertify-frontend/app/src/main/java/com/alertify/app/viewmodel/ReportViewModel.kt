package com.alertify.app.viewmodel

import com.alertify.app.data.model.ReportRequest
import androidx.lifecycle.*
import com.alertify.app.data.repository.ReportRepository
import com.alertify.app.utils.Resource
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*

class ReportViewModel : ViewModel() {
    private val repository = ReportRepository()

    // Estado del envío para la UI
    private val _reportStatus = MutableLiveData<Resource<Map<String, Any>>>()
    val reportStatus: LiveData<Resource<Map<String, Any>>> = _reportStatus

    fun sendReport(userId: Int, typeId: Int, desc: String, lat: Double, lon: Double) {
        val sdf = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }

        val request = ReportRequest(
            userId = userId,
            incidentTypeId = typeId,
            description = desc,
            latitude = lat,
            longitude = lon,
            //occurrenceDate = sdf.format(Date())
        )

        viewModelScope.launch {
            repository.createReport(request).collect {
                _reportStatus.value = it
            }
        }
    }
}