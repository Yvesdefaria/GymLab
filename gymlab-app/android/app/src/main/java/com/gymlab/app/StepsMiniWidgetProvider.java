package com.gymlab.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

// Widget mini 2×1 (F84d): solo el número de pasos. Todo el render vive en WidgetRender.
public class StepsMiniWidgetProvider extends AppWidgetProvider {
    @Override
    public void onEnabled(Context context) {
        // Mismo worker compartido que el widget grande (la unicidad la da WorkManager).
        WidgetSyncScheduler.INSTANCE.schedulePeriodic(context);
        WidgetSyncScheduler.INSTANCE.enqueueImmediate(context);
    }

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetRender.refreshAll(context);
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
        // Refresco manual SOLO en debug (84d.followups d), igual que el provider grande.
        if (WidgetRender.shouldHandleManualRefresh(WidgetRender.isDebuggable(context), intent.getAction())) {
            WidgetRender.refreshAll(context);
        }
    }
}
