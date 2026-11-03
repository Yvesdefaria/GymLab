package com.gymlab.app

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.HealthConnectFeatures
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.request.ReadRecordsRequest
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

    // Pasos de hoy por hora para el gráfico de /pasos (Fase 136.3). El plugin de salud
    // de la web solo agrega por día, así que la agregación horaria se hace acá con la
    // misma fuente (StepsRecord.COUNT_TOTAL, sin doble conteo entre orígenes).
    // Devuelve 24 slots (los buckets sin datos quedan en 0); null si no hay SDK o
    // permiso de lectura — el hook lo trata como "no disponible" y no miente con un 0.
    suspend fun readTodayStepsByHour(context: Context): IntArray? {
        if (HealthConnectClient.getSdkStatus(context) != HealthConnectClient.SDK_AVAILABLE) {
            return null
        }
        val client = HealthConnectClient.getOrCreate(context)
        val granted = client.permissionController.getGrantedPermissions()
        if (HealthPermission.getReadPermission(StepsRecord::class) !in granted) {
            return null
        }

        val zone = ZoneId.systemDefault()
        val start = LocalDate.now(zone).atStartOfDay(zone).toInstant()
        // Health Connect no permite cortes horarios en aggregateGroupByPeriod (mínimo un
        // día), así que se leen los registros del día y se agrupan por hora local.
        // Cada registro va a la hora de su inicio: los pasos se escriben en tramos cortos.
        val records = client.readRecords(
            ReadRecordsRequest(
                recordType = StepsRecord::class,
                timeRangeFilter = TimeRangeFilter.between(start, Instant.now()),
            )
        ).records

        val hours = IntArray(24)
        for (record in records) {
            if (record.count <= 0) continue
            val hour = record.startTime.atZone(zone).hour
            hours[hour] = (hours[hour] + record.count).coerceAtMost(Int.MAX_VALUE.toLong()).toInt()
        }
        return hours
    }
}
