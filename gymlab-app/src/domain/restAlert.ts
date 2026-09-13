// Planificador puro de la alerta de descanso (F96, D3). Sin React ni plugin:
// decide si la notificación nativa puede programarse, con qué exactitud y qué
// aviso no bloqueante corresponde; y resuelve el dedupe al reanudar. El efecto
// (llamar al plugin) vive en data/restAlertBridge.ts.

// Id fijo de la notificación de descanso (32-bit, válido en Android). Reutilizar
// el mismo id hace que programar/extends reemplace, nunca acumule pendientes.
export const REST_NOTIFICATION_ID = 9601

// Estado de permiso que devuelve el plugin (@capacitor/core PermissionState).
export type AlertPermission = 'granted' | 'denied' | 'prompt' | 'prompt-with-rationale'

// Ajuste de alarmas exactas en Android; `unknown` en iOS/web/Android < 12.
export type ExactAlarmSetting = 'granted' | 'denied' | 'unknown'

// Aviso no bloqueante (una sola vez) que la UI puede mostrar; no rompe el timer.
export type RestAlertWarning = 'permission_denied' | 'exact_alarm_denied'

export interface RestAlertGateInput {
  // `true` en la app Capacitor (iOS/Android); `false` en web/PWA.
  isNative: boolean
  // Permiso ya resuelto (tras pedirlo si hacía falta).
  permission: AlertPermission
  // Capacidad de alarmas exactas; `unknown` fuera de Android 12+.
  exactAlarm: ExactAlarmSetting
}

export interface RestAlertGate {
  // Solo se programa en nativo y con permiso concedido.
  shouldSchedule: boolean
  // Exactitud a solicitar al plugin: false cae a inexacto (Android sin permiso).
  exact: boolean
  // Aviso a mostrar; null si no hay nada que avisar.
  warning: RestAlertWarning | null
}

// Decisión pura: web nunca programa (el aviso en segundo plano no está prometido);
// nativo exige permiso y degrada a inexacto si Android no concede alarmas exactas.
export const planRestAlert = ({ isNative, permission, exactAlarm }: RestAlertGateInput): RestAlertGate => {
  if (!isNative) return { shouldSchedule: false, exact: false, warning: null }
  if (permission !== 'granted') return { shouldSchedule: false, exact: false, warning: 'permission_denied' }
  const exact = exactAlarm !== 'denied'
  return { shouldSchedule: true, exact, warning: exact ? null : 'exact_alarm_denied' }
}

// Notificación del SO programada para un deadline concreto.
export interface ScheduledRestAlert {
  id: number
  endsAt: number
}

// Dedupe (spec: "no double alerting on resume"): si el SO ya tiene/tenía una
// notificación para un deadline vencido, la app no repite la alerta in-app.
export const shouldSuppressInAppAlert = (
  scheduled: ScheduledRestAlert | null,
  nowMs: number
): boolean => scheduled !== null && nowMs >= scheduled.endsAt
