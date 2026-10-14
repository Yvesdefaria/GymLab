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

    // lote 32: el wiring de resolve() deja de ser invisible — el clamp de la rama fresca
    // y el fallback de meta tienen aserción directa (un drop del call rompe el suite).
    @Test
    public void resolveValues_rama_fresca_aplica_el_clamp_y_preserva_positivos() {
        assertEquals(0, WidgetRender.resolveValues(true, -500, 10_000).steps);
        assertEquals(4321, WidgetRender.resolveValues(true, 4321, 10_000).steps);
    }

    @Test
    public void resolveValues_no_fresca_da_cero_sin_importar_los_pasos() {
        assertEquals(0, WidgetRender.resolveValues(false, 4321, 10_000).steps);
        assertEquals(0, WidgetRender.resolveValues(false, -500, 10_000).steps);
    }

    @Test
    public void resolveValues_meta_invalida_cae_al_default_y_valida_se_conserva() {
        assertEquals(10_000, WidgetRender.resolveValues(true, 10, 0).goal);
        assertEquals(10_000, WidgetRender.resolveValues(true, 10, -1).goal);
        assertEquals(12_000, WidgetRender.resolveValues(true, 10, 12_000).goal);
    }
}
