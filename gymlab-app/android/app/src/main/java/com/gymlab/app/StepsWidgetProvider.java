package com.gymlab.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

// Widget grande 2×2 (F84d). Todo el render vive en WidgetRender.
public class StepsWidgetProvider extends AppWidgetProvider {
    // Refresco manual (debug/e2e):
    // adb shell am broadcast -n com.gymlab.app/.StepsWidgetProvider -a com.gymlab.app.action.REFRESH_WIDGETS
    static final String ACTION_REFRESH = "com.gymlab.app.action.REFRESH_WIDGETS";
    // E2E del worker de fondo (solo debug): escribe un override y encola el sync.
    // adb shell am broadcast -n com.gymlab.app/.StepsWidgetProvider \
    //   -a com.gymlab.app.action.DEBUG_SYNC_WIDGETS --ei steps 4321
    static final String ACTION_DEBUG_SYNC = "com.gymlab.app.action.DEBUG_SYNC_WIDGETS";

    @Override
    public void onEnabled(Context context) {
        // Primer widget colocado: no esperar hasta 15 min para el primer dato.
        WidgetSyncScheduler.INSTANCE.schedulePeriodic(context);
        WidgetSyncScheduler.INSTANCE.enqueueImmediate(context);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetRender.refreshAll(context);
        // El tick del sistema (~30 min) también trae datos frescos de Health Connect.
        WidgetSyncScheduler.INSTANCE.schedulePeriodic(context);
        WidgetSyncScheduler.INSTANCE.enqueueImmediate(context);
    }

    @Override
    public void onDisabled(Context context) {
        WidgetSyncScheduler.INSTANCE.cancelIfNoWidgets(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        // Refresco manual SOLO en debug (84d.followups d; el contrato puro vive en
        // WidgetRender.shouldHandleManualRefresh): el receiver es exportado (lo exige
        // APPWIDGET_UPDATE); el refresh real llega por onUpdate y el plugin.
        if (WidgetRender.shouldHandleManualRefresh(WidgetRender.isDebuggable(context), intent.getAction())) {
            WidgetRender.refreshAll(context);
        }
        if (WidgetRender.shouldHandleDebugSync(WidgetRender.isDebuggable(context), intent.getAction())) {
            int steps = intent.getIntExtra("steps", -1);
            if (steps >= 0) {
                WidgetRender.setDebugStepsOverride(context, steps);
            } else {
                WidgetRender.clearDebugStepsOverride(context);
            }
            WidgetSyncScheduler.INSTANCE.enqueueImmediate(context);
        }
    }
}
