package com.gymlab.app

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.ExistingWorkPolicy
import androidx.work.OneTimeWorkRequestBuilder
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import java.util.concurrent.TimeUnit

// Agenda el refresco nativo del widget (F84d-followup). 15 min es el mínimo real de
// WorkManager para trabajo periódico sin foreground service; el SO puede atrasarlo
// en Doze/App Standby. KEEP evita resetear el período en cada arranque de la app.
internal object WidgetSyncScheduler {
    private const val PERIODIC_WORK = "gymlab-widget-steps-periodic"
    private const val IMMEDIATE_WORK = "gymlab-widget-steps-immediate"
    private const val PERIOD_MINUTES = 15L

    fun schedulePeriodic(context: Context) {
        val request = PeriodicWorkRequestBuilder<WidgetSyncWorker>(PERIOD_MINUTES, TimeUnit.MINUTES).build()
        WorkManager.getInstance(context)
            .enqueueUniquePeriodicWork(PERIODIC_WORK, ExistingPeriodicWorkPolicy.KEEP, request)
    }

    // Refresco puntual: al colocar el widget y en cada tick del sistema.
    fun enqueueImmediate(context: Context) {
        val request = OneTimeWorkRequestBuilder<WidgetSyncWorker>().build()
        WorkManager.getInstance(context)
            .enqueueUniqueWork(IMMEDIATE_WORK, ExistingWorkPolicy.KEEP, request)
    }

    // Sin widgets colocados no hay nada que refrescar.
    fun cancelIfNoWidgets(context: Context) {
        val manager = AppWidgetManager.getInstance(context)
        val hasBig = manager.getAppWidgetIds(ComponentName(context, StepsWidgetProvider::class.java)).isNotEmpty()
        val hasMini = manager.getAppWidgetIds(ComponentName(context, StepsMiniWidgetProvider::class.java)).isNotEmpty()
        if (hasBig || hasMini) return
        WorkManager.getInstance(context).cancelUniqueWork(PERIODIC_WORK)
        WorkManager.getInstance(context).cancelUniqueWork(IMMEDIATE_WORK)
    }
}
