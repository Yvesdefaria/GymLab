package com.gymlab.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebView.HitTestResult;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        // F84d: plugin local del widget (debe registrarse antes de super.onCreate).
        registerPlugin(GymLabWidgetPlugin.class);
        // F84d-followup: permiso de lectura de salud en background para el worker.
        registerPlugin(GymLabHealthPlugin.class);
        super.onCreate(savedInstanceState);

        // F84d-followup: el refresco del widget sobrevive a la app cerrada. Se agenda
        // en cada arranque; KEEP no resetea el período si ya estaba agendado.
        WidgetSyncScheduler.INSTANCE.schedulePeriodic(this);

        // La WebView muestra un bocadillo nativo con la URL interna al mantener pulsado un link;
        // el evento DOM `contextmenu` no lo cancela (probado en emulador). Se consume el
        // long-press a nivel Vista SOLO sobre enlaces; la selección de texto normal sigue igual.
        // Cubre links http/s (SRC_ANCHOR_TYPE, ANCHOR_TYPE, SRC_IMAGE_ANCHOR_TYPE) y los no-http:
        // mailto: (EMAIL_TYPE), tel: (PHONE_TYPE) y geo: (GEO_TYPE).
        WebView webView = getBridge().getWebView();
        webView.setLongClickable(true);
        webView.setOnLongClickListener(view -> {
            int type = ((WebView) view).getHitTestResult().getType();
            return type == HitTestResult.SRC_ANCHOR_TYPE
                || type == HitTestResult.ANCHOR_TYPE
                || type == HitTestResult.SRC_IMAGE_ANCHOR_TYPE
                || type == HitTestResult.EMAIL_TYPE
                || type == HitTestResult.PHONE_TYPE
                || type == HitTestResult.GEO_TYPE;
        });
    }
}
