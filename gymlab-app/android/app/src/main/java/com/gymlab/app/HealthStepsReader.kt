package com.gymlab.app

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.HealthConnectFeatures
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

// Lectura nativa de pasos para el refresco del widget (F84d-followup). Usa la misma
// agregación que la app (StepsRecord.COUNT_TOTAL) pero sin WebView, así puede correr
// con la app cerrada. Devuelve null cuando no hay datos utilizables (sin SDK, sin
// permiso o sin registros), y el worker lo trata como no-op.
internal object HealthStepsReader {
    suspend fun readTodaySteps(context: Context): Int? {
        if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
            return null
        }
        val client = HealthConnectClient.getOrCreate(context)
        // Health Connect exige disponibilidad + un permiso aparte para leer en background.
        // Sin ambos, `aggregate` falla y el worker no puede refrescar el widget.
        if (client.features.getFeatureStatus(
                HealthConnectFeatures.FEATURE_READ_HEALTH_DATA_IN_BACKGROUND,
            ) != HealthConnectFeatures.FEATURE_STATUS_AVAILABLE
        ) {
            return null
        }
        val granted = client.permissionController.getGrantedPermissions()
        if (HealthPermission.getReadPermission(StepsRecord::class) !in granted ||
            HealthPermission.PERMISSION_READ_HEALTH_DATA_IN_BACKGROUND !in granted
        ) {
            return null
        }

        // Día local: mismo criterio que toLocalDateStr() de la web.
        val zone = ZoneId.systemDefault()
        val start = LocalDate.now(zone).atStartOfDay(zone).toInstant()
        val result = client.aggregate(
            AggregateRequest(
                metrics = setOf(StepsRecord.COUNT_TOTAL),
                timeRangeFilter = TimeRangeFilter.between(start, Instant.now()),
            )
        )
        val total = result[StepsRecord.COUNT_TOTAL] ?: return null
        return total.coerceIn(0L, Int.MAX_VALUE.toLong()).toInt()
    }
}
