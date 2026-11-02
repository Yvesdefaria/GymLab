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

// Permiso de lectura de salud en background (F84d-followup): Health Connect lo exige
// para que el worker de WorkManager pueda leer pasos con la app cerrada. El plugin de
// salud no lo expone, así que se pide acá con el mismo contrato oficial.
//
// Este plugin NO decide cuándo preguntar: expone estado y pedido. La política (pedir
// una vez, "no volver a preguntar") vive en la web, para que un "cancelar" del sistema
// no deje el permiso inalcanzable para siempre.
@CapacitorPlugin(name = "GymLabHealth")
class GymLabHealthPlugin : Plugin() {
    private lateinit var backgroundLauncher: ActivityResultLauncher<Set<String>>
    private val pendingCall = AtomicReference<PluginCall?>(null)

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

    // Estado sin diálogo: Ajustes lo consulta al montar y al volver del sistema.
    @PluginMethod
    fun getBackgroundReadStatus(call: PluginCall) {
        if (!isAvailable(context)) {
            call.resolve(result(false, available = false))
            return
        }
        CoroutineScope(Dispatchers.IO).launch {
            val granted = grantedPermissions(context)
            withContext(Dispatchers.Main) {
                call.resolve(
                    result(
                        HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND in granted,
                        available = true,
                    ),
                )
            }
        }
    }

    // Pedido explícito: siempre se puede volver a pedir (si ya está concedido, responde
    // al instante sin abrir diálogo).
    @PluginMethod
    fun requestBackgroundRead(call: PluginCall) {
        if (!isAvailable(context)) {
            call.resolve(result(false, available = false))
            return
        }
        CoroutineScope(Dispatchers.IO).launch {
            if (HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND in grantedPermissions(context)) {
                withContext(Dispatchers.Main) { call.resolve(result(true, available = true)) }
                return@launch
            }
            withContext(Dispatchers.Main) {
                // Una sola solicitud a la vez: una llamada previa sin resolver no debe colgarse.
                pendingCall.getAndSet(call)?.resolve(result(false, available = true))
                backgroundLauncher.launch(
                    setOf(HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND),
                )
            }
        }
    }

    private fun isAvailable(context: Context): Boolean {
        if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
            return false
        }
        return HealthConnectClient.getOrCreate(context).features.getFeatureStatus(
            HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_IN_BACKGROUND,
        ) == HealthConnectFeatures.FEATURE_STATUS_AVAILABLE
    }

    private suspend fun grantedPermissions(context: Context): Set<String> = try {
        HealthConnectClient.getOrCreate(context).permissionController.getGrantedPermissions()
    } catch (error: Exception) {
        emptySet()
    }

    private fun result(granted: Boolean, available: Boolean): JSObject =
        JSObject().put("granted", granted).put("available", available)
}
