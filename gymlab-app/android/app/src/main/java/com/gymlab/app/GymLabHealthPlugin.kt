package com.gymlab.app

import android.content.Context
import androidx.activity.result.ActivityResultLauncher
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.HealthConnectFeatures
import androidx.health.connect.client.PermissionController
import androidx.health.connect.client.permission.HealthPermission
import com.getcapacitor.JSObject
import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod
import com.getcapacitor.annotation.CapacitorPlugin
import java.util.concurrent.atomic.AtomicReference
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

// Permiso de lectura en background (F84d-followup): Health Connect lo exige para que
// el worker de WorkManager pueda leer pasos con la app cerrada. El plugin de salud
// no lo expone, así que se pide acá con el mismo contrato oficial.
@CapacitorPlugin(name = "GymLabHealth")
class GymLabHealthPlugin : Plugin() {
    private lateinit var backgroundLauncher: ActivityResultLauncher<Set<String>>
    private val pendingCall = AtomicReference<PluginCall?>(null)
    // El pedido se hace una sola vez por instalación; si el usuario deniega, puede
    // volver a concederlo desde los ajustes de Health Connect.
    private val askedPrefs get() = context.getSharedPreferences("gymlab_health", Context.MODE_PRIVATE)

    override fun load() {
        super.load()
        backgroundLauncher = activity.registerForActivityResult(
            PermissionController.createRequestPermissionResultContract(),
        ) { granted ->
            pendingCall.getAndSet(null)?.resolve(
                result(
                    granted.contains(HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND),
                    available = true,
                ),
            )
        }
    }

    @PluginMethod
    fun requestBackgroundRead(call: PluginCall) {
        if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
            call.resolve(result(false, available = false))
            return
        }
        val client = HealthConnectClient.getOrCreate(context)
        if (client.features.getFeatureStatus(
                HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_IN_BACKGROUND,
            ) != HealthConnectFeatures.FEATURE_STATUS_AVAILABLE
        ) {
            call.resolve(result(false, available = false))
            return
        }
        CoroutineScope(Dispatchers.IO).launch {
            val granted = try {
                client.permissionController.getGrantedPermissions()
            } catch (error: Exception) {
                emptySet()
            }
            if (HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND in granted) {
                withContext(Dispatchers.Main) { call.resolve(result(true, available = true)) }
                return@launch
            }
            if (askedPrefs.getBoolean("backgroundReadAsked", false)) {
                withContext(Dispatchers.Main) { call.resolve(result(false, available = true)) }
                return@launch
            }
            askedPrefs.edit().putBoolean("backgroundReadAsked", true).apply()
            withContext(Dispatchers.Main) {
                // Una sola solicitud a la vez: una llamada previa sin resolver no debe colgarse.
                pendingCall.getAndSet(call)?.resolve(result(false, available = true))
                backgroundLauncher.launch(
                    setOf(HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND),
                )
            }
        }
    }

    private fun result(granted: Boolean, available: Boolean): JSObject =
        JSObject().put("granted", granted).put("available", available)
}
