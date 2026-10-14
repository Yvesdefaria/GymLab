package com.gymlab.app;

import static org.junit.Assert.assertEquals;
import static org.junit.Assert.assertFalse;
import static org.junit.Assert.assertTrue;

import org.junit.Test;

// Cobertura JVM (lote 29) de las decisiones puras del widget que antes solo tenían
// evidencia de emulador: el clamp de pasos (84d.followups e) y el contrato del
// refresco manual (84d.followups d; release lo ignora, debug lo atiende).
public class WidgetRenderTest {

    @Test
    public void clampSteps_no_deja_pasar_negativos() {
        assertEquals(0, WidgetRender.clampSteps(-500));
        assertEquals(0, WidgetRender.clampSteps(0));
        assertEquals(7, WidgetRender.clampSteps(7));
        assertEquals(8432, WidgetRender.clampSteps(8432));
    }

    @Test
    public void refresco_manual_ignorado_en_release() {
        assertFalse(WidgetRender.shouldHandleManualRefresh(false, StepsWidgetProvider.ACTION_REFRESH));
    }

    @Test
    public void refresco_manual_atiende_en_debug() {
        assertTrue(WidgetRender.shouldHandleManualRefresh(true, StepsWidgetProvider.ACTION_REFRESH));
    }

    @Test
    public void refresco_manual_ignora_otras_acciones_y_nulos() {
        assertFalse(WidgetRender.shouldHandleManualRefresh(true, "com.gymlab.app.action.OTRA"));
        assertFalse(WidgetRender.shouldHandleManualRefresh(true, null));
        assertFalse(WidgetRender.shouldHandleManualRefresh(false, null));
    }
}
