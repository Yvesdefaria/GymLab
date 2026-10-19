package com.gymlab.app

import android.content.Context
import androidx.work.CoroutineWorker
import androidx.work.WorkerParameters

// Refresco del widget con la app cerrada (F84d-followup): lee los pasos de Health
// Connect en nativo y actualiza el snapshot + ambos widgets. Sin WebView de por medio.
class WidgetSyncWorker(context: Context, params: WorkerParameters) : CoroutineWorker(context, params) {
    override suspend fun doWork(): Result {
        val context = applicationContext
        return try {
            // Override de E2E (solo debug): el emulador no tiene fuente de pasos.
            val steps = WidgetRender.debugStepsOverride(context)
                ?: HealthStepsReader.readTodaySteps(context)

            // Sin datos o 0: no se toca el snapshot (un 0 no pisa un registro manual).
            if (steps == null || !WidgetRender.shouldPersistNativeSteps(steps)) {
                return Result.success()
            }

            WidgetRender.saveSteps(context, steps, WidgetRender.todayLocalDate())
            WidgetRender.refreshAll(context)
            Result.success()
        } catch (error: Exception) {
            // Fallo transitorio de Health Connect/WorkManager: reintentar con backoff,
            // con tope para no quedar en un loop de batería.
            if (runAttemptCount < MAX_RETRIES) Result.retry() else Result.success()
        }
    }

    private companion object {
        const val MAX_RETRIES = 3
    }
}
