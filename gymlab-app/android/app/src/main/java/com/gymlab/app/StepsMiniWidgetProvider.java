package com.gymlab.app;

import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;

// Widget mini 2×1 (F84d): solo el número de pasos. Todo el render vive en WidgetRender.
public class StepsMiniWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager appWidgetManager, int[] appWidgetIds) {
        WidgetRender.refreshAll(context);
    }

    @Override
    public void onReceive(Context context, Intent intent) {
        super.onReceive(context, intent);
        if (StepsWidgetProvider.ACTION_REFRESH.equals(intent.getAction())) {
            WidgetRender.refreshAll(context);
        }
    }
}
