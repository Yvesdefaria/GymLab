package com.gymlab.app;

import android.content.Intent;
import android.net.Uri;
import android.provider.Settings;
import android.util.Log;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Puente JS → Ajustes del sistema: con el permiso de notificaciones denegado la app
// ya no puede volver a pedirlo; el usuario tiene que rehabilitarlo en Ajustes.
@CapacitorPlugin(name = "GymLabSettings")
public class GymLabSettingsPlugin extends Plugin {
    private static final String TAG = "GymLabSettings";

    @PluginMethod
    public void openNotificationSettings(PluginCall call) {
        try {
            Intent intent = new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS);
            intent.putExtra(Settings.EXTRA_APP_PACKAGE, getContext().getPackageName());
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
            call.resolve();
        } catch (Exception first) {
            Log.w(TAG, "notification settings unavailable, falling back to app details", first);
            try {
                Intent fallback = new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS);
                fallback.setData(Uri.parse("package:" + getContext().getPackageName()));
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                getContext().startActivity(fallback);
                call.resolve();
            } catch (Exception second) {
                Log.e(TAG, "could not open system settings", second);
                call.reject("Could not open system settings");
            }
        }
    }

    // F128: el JS deja acá el gate de telemetría ya resuelto (producción + claves +
    // consentimiento). NativeTelemetry lo persiste y aplica init/close en el acto.
    @PluginMethod
    public void setTelemetryConsent(PluginCall call) {
        Boolean enabled = call.getBoolean("enabled", false);
        NativeTelemetry.setConsent(getContext(), Boolean.TRUE.equals(enabled));
        call.resolve();
    }
}
