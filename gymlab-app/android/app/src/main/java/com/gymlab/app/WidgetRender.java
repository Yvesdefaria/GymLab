package com.gymlab.app;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.content.pm.ApplicationInfo;
import android.content.res.ColorStateList;
import android.net.Uri;
import android.os.Build;
import android.widget.RemoteViews;

import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

// Render compartido de los widgets de pasos (F84d): resuelve el snapshot guardado
// (con guarda de día) y arma los RemoteViews de ambos tamaños desde un solo lugar.
final class WidgetRender {
    private static final String PREFS = "gymlab_widget";
    private static final String KEY_STEPS = "steps";
    private static final String KEY_GOAL = "goal";
    private static final String KEY_DATE = "date";
    private static final String KEY_UPDATED_AT = "updatedAt";
    private static final int DEFAULT_GOAL = 10_000;
    // Colores desde colors.xml (84d.followups e): fuente única con los layouts,
    // sin ARGB duplicado acá. El verde de meta cumplida es `widget_success`.
    // `context.getColor` es API 23+ (lote 29, R3-context-getcolor-api23); el proyecto
    // es minSdk 26 (android/variables.gradle): siempre disponible.
    // Contraparte web: WIDGET_PASSOS_URL en src/data/widgetDeepLinks.ts.
    private static final String PASSOS_URL = "com.gymlab.app://pasos";

    private WidgetRender() {}

    // Gate de debug (84d.followups d): sin BuildConfig (AGP 8 no lo genera por
    // default), el flag real del build alcanza para el refresco manual.
    static boolean isDebuggable(Context context) {
        return (context.getApplicationInfo().flags & ApplicationInfo.FLAG_DEBUGGABLE) != 0;
    }

    // Contrato del refresco manual (lote 29 R3-debug-refresh-contract): en release el
    // broadcast se ignora; en debug redibuja. Decisión pura, testeada en JVM (WidgetRenderTest).
    static boolean shouldHandleManualRefresh(boolean debuggable, String action) {
        return debuggable && StepsWidgetProvider.ACTION_REFRESH.equals(action);
    }

    // Clamp de pasos (84d.followups e): los negativos no existen en pantalla. Puro y
    // testeado en JVM (WidgetRenderTest); el wiring de prefs sigue validado en emulador.
    static int clampSteps(int steps) {
        return Math.max(0, steps);
    }

    // Único punto de escritura del snapshot (lo llama el plugin; los providers solo leen).
    static void saveSnapshot(Context context, int steps, int goal, String date) {
        context.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit()
            .putInt(KEY_STEPS, steps)
            .putInt(KEY_GOAL, goal)
            .putString(KEY_DATE, date)
            .putLong(KEY_UPDATED_AT, System.currentTimeMillis())
            .apply();
    }

    // Redibuja ambos widgets desde el snapshot guardado (push del plugin y refresco manual).
    static void refreshAll(Context context) {
        AppWidgetManager manager = AppWidgetManager.getInstance(context);
        manager.updateAppWidget(new ComponentName(context, StepsWidgetProvider.class), buildBigViews(context));
        manager.updateAppWidget(new ComponentName(context, StepsMiniWidgetProvider.class), buildMiniViews(context));
    }

    static RemoteViews buildBigViews(Context context) {
        Resolved r = resolve(context);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_steps);
        int color = r.met ? context.getColor(R.color.widget_success) : context.getColor(R.color.widget_accent);
        views.setTextViewText(R.id.widget_steps, formatNumber(r.steps));
        views.setTextViewText(R.id.widget_goal, "of " + formatNumber(r.goal));
        views.setTextViewText(R.id.widget_pct, String.format(Locale.US, "%d%%", r.displayPct));
        views.setTextColor(R.id.widget_pct, color);
        views.setProgressBar(R.id.widget_progress, 100, r.fillPct, false);
        // RemoteViews solo puede transportar tints de forma reflexiva desde API 31 (setColorStateList).
        // En APIs anteriores la barra conserva el tint estático del layout (gold).
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            views.setColorStateList(R.id.widget_progress, "setProgressTintList", ColorStateList.valueOf(color));
            views.setColorStateList(R.id.widget_progress, "setProgressBackgroundTintList", ColorStateList.valueOf(context.getColor(R.color.widget_track)));
        }
        views.setOnClickPendingIntent(R.id.widget_root, openAppIntent(context));
        return views;
    }

    static RemoteViews buildMiniViews(Context context) {
        Resolved r = resolve(context);
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_steps_mini);
        views.setTextViewText(R.id.widget_mini_steps, formatNumber(r.steps));
        views.setTextColor(R.id.widget_mini_steps, r.met ? context.getColor(R.color.widget_success) : context.getColor(R.color.widget_text));
        views.setOnClickPendingIntent(R.id.widget_mini_root, openAppIntent(context));
        return views;
    }

    // Lee el snapshot y aplica las reglas del spec (fecha vieja → 0; meta inválida → default;
    // pasos negativos → 0, 84d.followups e).
    private static Resolved resolve(Context context) {
        SharedPreferences prefs = context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        String today = new SimpleDateFormat("yyyy-MM-dd", Locale.US).format(new Date());
        boolean fresh = today.equals(prefs.getString(KEY_DATE, null));
        int steps = fresh ? clampSteps(prefs.getInt(KEY_STEPS, 0)) : 0;
        int goal = prefs.getInt(KEY_GOAL, DEFAULT_GOAL);
        if (goal <= 0) goal = DEFAULT_GOAL;
        return new Resolved(steps, goal);
    }

    // Formato inglés para el copy del widget (decisión de producto), sin importar el locale del device.
    private static String formatNumber(int value) {
        return String.format(Locale.US, "%,d", value);
    }

    // Tap → abrir la app en /pasos (el scheme ya está declarado en strings.xml y el manifest).
    private static PendingIntent openAppIntent(Context context) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setAction(Intent.ACTION_VIEW);
        intent.setData(Uri.parse(PASSOS_URL));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        return PendingIntent.getActivity(
            context, 0, intent,
            PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
    }

    // Valores ya resueltos para pintar: tope 100% en la barra, % real, verde si steps >= goal.
    private static final class Resolved {
        final int steps;
        final int goal;
        final int fillPct;
        final int displayPct;
        final boolean met;

        Resolved(int steps, int goal) {
            this.steps = steps;
            this.goal = goal;
            this.met = steps >= goal;
            this.fillPct = Math.min(100, Math.round(steps * 100f / goal));
            this.displayPct = Math.round(steps * 100f / goal);
        }
    }
}
