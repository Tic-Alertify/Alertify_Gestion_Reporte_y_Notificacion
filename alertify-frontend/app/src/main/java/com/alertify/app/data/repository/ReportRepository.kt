package com.alertify.app.data.repository

import com.alertify.app.data.network.RetrofitClient
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.lang.Exception
import com.alertify.app.data.model.HeatmapPoint
import com.alertify.app.data.model.ReportRequest
import com.alertify.app.data.model.ReportResponse
import com.alertify.app.utils.Resource
import com.alertify.app.data.network.SocketManager


class ReportRepository {
    private val api = RetrofitClient.apiService
    private val socketManager = SocketManager

    fun getHeatmapData(days: Int): Flow<Resource<List<HeatmapPoint>>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getHeatmapData(days)
            if (response.isSuccessful) {
                emit(Resource.Success(response.body()?.points ?: emptyList()))
            } else {
                emit(Resource.Error("Error del servidor: ${response.code()}"))
            }
        } catch (e: Exception) {
            emit(Resource.Error("Fallo de red: ${e.message}"))
        }
    }

    fun getValidatedReports(): Flow<Resource<List<ReportResponse>>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.getValidatedReports()
            if (response.isSuccessful) {
                emit(Resource.Success(response.body() ?: emptyList()))
            }
        } catch (e: Exception) {
            emit(Resource.Error(e.message ?: "Error desconocido"))
        }
    }

    fun createReport(request: ReportRequest): Flow<Resource<Map<String, Any>>> = flow {
        emit(Resource.Loading)
        try {
            val response = api.createReport(request)
            if (response.isSuccessful) emit(Resource.Success(response.body()!!))
            else emit(Resource.Error("Error al reportar: ${response.message()}"))
        } catch (e: Exception) {
            emit(Resource.Error("Verifica tu conexión a internet"))
        }
    }

    fun listenToLiveReports(): Flow<ReportResponse> = socketManager.newReports

    fun initSocket() {
        socketManager.connect()
    }

    suspend fun getReportsByUser(userId: Int): Resource<List<ReportResponse>> {
        return try {

            val response = api.getUserReports(userId)
            if (response.isSuccessful && response.body() != null) {
                Resource.Success(response.body()!!)
            } else {
                Resource.Error("Error al obtener el historial")
            }
        } catch (e: Exception) {
            Resource.Error("Fallo de conexión: ${e.message}")
        }
    }
}