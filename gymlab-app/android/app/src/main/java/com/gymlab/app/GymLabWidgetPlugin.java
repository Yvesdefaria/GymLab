package com.gymlab.app;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

// Puente JS → nativo (F84d): recibe el snapshot y redibuja ambos widgets al instante.
@CapacitorPlugin(name = "GymLabWidget")
public class GymLabWidgetPlugin extends Plugin {
    @PluginMethod
    public void update(PluginCall call) {
        Integer steps = call.getInt("steps");
        Integer goal = call.getInt("goal");
        String date = call.getString("date");
        if (steps == null || goal == null || date == null) {
            call.reject("steps, goal and date are required");
            return;
        }
        WidgetRender.saveSnapshot(getContext(), steps, goal, date);
        WidgetRender.refreshAll(getContext());
        call.resolve();
    }
}
