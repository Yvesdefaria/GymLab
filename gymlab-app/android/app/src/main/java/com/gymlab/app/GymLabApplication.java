package com.gymlab.app;

import android.app.Application;

// F128: el SDK nativo de Sentry se inicializa en Application.onCreate, antes de
// cualquier Activity, para capturar también los crashes de arranque. Si no hay
// consentimiento persistido, NativeTelemetry no hace nada.
public class GymLabApplication extends Application {
    @Override
    public void onCreate() {
        super.onCreate();
        NativeTelemetry.initIfConsented(this);
    }
}
