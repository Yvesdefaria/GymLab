package com.gymlab.app;

import android.os.Bundle;
import android.webkit.WebView;
import android.webkit.WebView.HitTestResult;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // La WebView muestra un bocadillo nativo con la URL interna al mantener pulsado un link;
        // el evento DOM `contextmenu` no lo cancela (probado en emulador). Se consume el
        // long-press a nivel Vista SOLO sobre enlaces; la selección de texto normal sigue igual.
        WebView webView = getBridge().getWebView();
        webView.setLongClickable(true);
        webView.setOnLongClickListener(view -> {
            int type = ((WebView) view).getHitTestResult().getType();
            return type == HitTestResult.SRC_ANCHOR_TYPE
                || type == HitTestResult.ANCHOR_TYPE
                || type == HitTestResult.SRC_IMAGE_ANCHOR_TYPE;
        });
    }
}
