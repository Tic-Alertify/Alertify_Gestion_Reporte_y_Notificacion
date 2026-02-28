package com.alertify.app.ui.report

import android.Manifest
import android.content.pm.PackageManager
import android.graphics.Color
import android.location.Location
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ArrayAdapter
import androidx.core.app.ActivityCompat
import androidx.fragment.app.Fragment
import androidx.lifecycle.lifecycleScope
import androidx.navigation.fragment.findNavController
import com.alertify.app.R
import com.alertify.app.data.model.ReportRequest
import com.alertify.app.data.network.RetrofitClient
import com.alertify.app.databinding.FragmentReportBinding
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.gms.maps.CameraUpdateFactory
import com.google.android.gms.maps.GoogleMap
import com.google.android.gms.maps.OnMapReadyCallback
import com.google.android.gms.maps.SupportMapFragment
import com.google.android.gms.maps.model.*
import com.google.android.material.snackbar.Snackbar
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

class ReportFragment : Fragment(), OnMapReadyCallback {

    private var _binding: FragmentReportBinding? = null
    private val binding get() = _binding!!

    private lateinit var mMap: GoogleMap
    private var selectedLocation: LatLng? = null
    private lateinit var fusedLocationClient: FusedLocationProviderClient

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View {
        _binding = FragmentReportBinding.inflate(inflater, container, false)
        return binding.root
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(requireActivity())

        val mapFragment = childFragmentManager.findFragmentById(R.id.map) as SupportMapFragment?
        mapFragment?.getMapAsync(this)

        setupSpinner()

        binding.btnSendReport.setOnClickListener {
            validateAndSendReport()
        }
    }

    override fun onMapReady(googleMap: GoogleMap) {
        mMap = googleMap

        val quitoCentral = LatLng(-0.180653, -78.467834)
        mMap.moveCamera(CameraUpdateFactory.newLatLngZoom(quitoCentral, 12f))
        mMap.setMapStyle(MapStyleOptions.loadRawResourceStyle(requireContext(), R.raw.map_style))

        mMap.setOnMapClickListener { latLng ->
            mMap.clear()
            drawDangerZones() // Ejemplo estático
            loadOfficialReports() // Cargar reportes reales tras limpiar
            mMap.addMarker(MarkerOptions().position(latLng).title("Punto del Incidente"))
            selectedLocation = latLng
        }

        drawDangerZones()
        loadOfficialReports()
        getCurrentLocation()
    }

    private fun isLocationInQuito(lat: Double, lng: Double): Boolean {
        val northBound = 0.05
        val southBound = -0.35
        val westBound = -78.60
        val eastBound = -78.35
        return lat in southBound..northBound && lng in westBound..eastBound
    }

    private fun loadOfficialReports() {
        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.getValidatedReports()
                if (response.isSuccessful) {
                    val reports = response.body() ?: emptyList()

                    // Limpiar el mapa antes de cargar para evitar duplicados
                    mMap.clear()
                    drawDangerZones() // Dibujar la zona estática de Quito

                    reports.forEach { report ->
                        val pos = LatLng(report.latitude, report.longitude)

                        // 1. Marcador con icono personalizado según el tipo
                        mMap.addMarker(MarkerOptions()
                            .position(pos)
                            .title("${report.incidentType}: ${report.description}")
                            .icon(BitmapDescriptorFactory.defaultMarker(BitmapDescriptorFactory.HUE_RED)))

                        // 2. Círculo de Calor (Zonas de peligro reales)
                        // El radio puede depender del puntaje de confianza (T17)
                        val radius = 100.0 + (report.trustScore * 50)

                        mMap.addCircle(CircleOptions().apply {
                            center(pos)
                            radius(radius) // Metros de influencia
                            fillColor(Color.parseColor("#55FF0000")) // Rojo traslúcido
                            strokeColor(Color.parseColor("#AAFF0000"))
                            strokeWidth(2f)
                        })
                    }
                }
            } catch (e: Exception) {
                Log.e("Alertify", "Error al recolectar data oficial: ${e.message}", e)
            }
        }
    }
    private fun drawHeatCircle(position: LatLng) {
        mMap.addCircle(CircleOptions().apply {
            center(position)
            radius(150.0)
            fillColor(Color.parseColor("#44FF0000"))
            strokeColor(Color.TRANSPARENT)
        })
    }

    private fun drawDangerZones() {
        val quitoDangerZone = LatLng(-0.1807, -78.4678)
        mMap.addCircle(CircleOptions().apply {
            center(quitoDangerZone)
            radius(300.0)
            strokeColor(Color.parseColor("#80FF0000"))
            fillColor(Color.parseColor("#33FF0000"))
            strokeWidth(2f)
        })
    }

    private fun getCurrentLocation() {
        if (ActivityCompat.checkSelfPermission(requireContext(), Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(arrayOf(Manifest.permission.ACCESS_FINE_LOCATION), 100)
            return
        }

        fusedLocationClient.lastLocation.addOnSuccessListener { location: Location? ->
            location?.let {
                val currentLatLng = LatLng(it.latitude, it.longitude)
                mMap.animateCamera(CameraUpdateFactory.newLatLngZoom(currentLatLng, 15f))
                selectedLocation = currentLatLng
            }
        }
    }

    private fun setupSpinner() {
        val types = arrayOf("Robo", "Asalto", "Accidente", "Sospechoso")
        val adapter = ArrayAdapter(requireContext(), android.R.layout.simple_spinner_dropdown_item, types)
        binding.spinnerIncidentType.adapter = adapter
    }

    private fun validateAndSendReport() {
        val description = binding.etDescription.text.toString().trim()
        val typeId = binding.spinnerIncidentType.selectedItemPosition + 1

        if (selectedLocation == null) {
            showTopFeedback("Selecciona una ubicación en el mapa", true)
            return
        }

        // Validación de Geofencing antes de enviar (T01)
        if (!isLocationInQuito(selectedLocation!!.latitude, selectedLocation!!.longitude)) {
            showTopFeedback("Error: Solo se permiten reportes dentro de Quito", true)
            return
        }

        if (description.isEmpty()) {
            binding.etDescription.error = "La descripción es obligatoria"
            return
        }

        val reportRequest = ReportRequest(
            userId = 1,
            incidentTypeId = typeId,
            latitude = selectedLocation!!.latitude,
            longitude = selectedLocation!!.longitude,
            description = description
        )

        binding.btnSendReport.isEnabled = false
        binding.btnSendReport.text = "Enviando..."

        lifecycleScope.launch {
            try {
                val response = RetrofitClient.apiService.createReport(reportRequest)

                if (response.isSuccessful) {
                    showTopFeedback("¡Reporte enviado exitosamente!", false)
                    delay(2000)
                    findNavController().popBackStack()
                } else {
                    val errorBody = response.errorBody()?.string() ?: ""
                    val serverMessage = parseErrorMessage(errorBody)
                    showTopFeedback(serverMessage, true)

                    binding.btnSendReport.isEnabled = true
                    binding.btnSendReport.text = "Enviar Reporte"
                }
            } catch (e: Exception) {
                Log.e("Alertify", "Error de red: ${e.message}")
                showTopFeedback("Sin conexión: Verifica tu IP o Firewall", true)
                binding.btnSendReport.isEnabled = true
                binding.btnSendReport.text = "Enviar Reporte"
            }
        }
    }

    private fun parseErrorMessage(json: String): String {
        return try {
            val jsonObject = org.json.JSONObject(json)
            jsonObject.getString("message")
        } catch (e: Exception) {
            "Error al procesar el reporte"
        }
    }

    private fun showTopFeedback(message: String, isError: Boolean) {
        binding.tvFeedbackMessage.text = message
        val color = if (isError) Color.RED else Color.parseColor("#283593")
        binding.cardFeedback.setCardBackgroundColor(color)

        binding.cardFeedback.visibility = View.VISIBLE
        binding.cardFeedback.alpha = 0f
        binding.cardFeedback.animate().alpha(1f).setDuration(400).start()

        lifecycleScope.launch {
            delay(4000)
            binding.cardFeedback.animate().alpha(0f).setDuration(400).withEndAction {
                binding.cardFeedback.visibility = View.GONE
            }.start()
        }
    }

    override fun onDestroyView() {
        super.onDestroyView()
        _binding = null
    }
}