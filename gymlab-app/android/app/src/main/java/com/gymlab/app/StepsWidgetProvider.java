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

    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetRender.refreshAll(context);
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
    }
}
