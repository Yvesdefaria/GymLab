package com.gymlab.app;

import android.content.Context;
import android.content.SharedPreferences;
import android.util.Log;

import io.sentry.Sentry;
import io.sentry.android.core.SentryAndroid;

// F128: crash handler del contenedor nativo. El SDK solo existe si el flag
// persistido está ON: lo escribe el JS con el mismo gate que la web
// (producción + claves + consentimiento). Sin flag no hay init ni handler.
final class NativeTelemetry {
    private static final String TAG = "GymLabTelemetry";
    private static final String PREFS = "gymlab_telemetry";
    private static final String KEY_CONSENT = "consent";

    private static boolean initialized = false;

    private NativeTelemetry() {}

    private static SharedPreferences prefs(Context context) {
        return context.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    static boolean hasConsent(Context context) {
        return prefs(context).getBoolean(KEY_CONSENT, false);
    }

    // Arranque: lee el flag ANTES de inicializar (S2).
    static void initIfConsented(Context context) {
        if (hasConsent(context)) init(context, false);
    }

    // Toggle de Ajustes: persiste y aplica en el acto, sin esperar al próximo arranque.
    static void setConsent(Context context, boolean consent) {
        prefs(context).edit().putBoolean(KEY_CONSENT, consent).apply();
        if (consent) {
            init(context, true);
        } else if (initialized) {
            // Cierra el hub: deja de capturar y de enviar aunque el proceso siga vivo.
            Sentry.close();
            initialized = false;
        }
    }

    private static void init(Context context, boolean force) {
        String dsn = BuildConfig.SENTRY_DSN;
        if (dsn == null || dsn.isEmpty()) {
            Log.w(TAG, "SENTRY_DSN vacío: el SDK nativo no inicializa");
            return;
        }
        try {
            SentryAndroid.init(context, options -> {
                options.setDsn(dsn);
                options.setForceInit(force);
                // Misma semántica que la web (S3): sin trazas, sin PII, sin sesiones.
                options.setTracesSampleRate(0.0);
                options.setSendDefaultPii(false);
                options.setEnableAutoSessionTracking(false);
            });
            initialized = true;
        } catch (Exception error) {
            Log.e(TAG, "no se pudo inicializar el SDK nativo", error);
        }
    }
}
