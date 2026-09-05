// Secciones legales de las páginas /terminos y /privacidad.
// Fuente única del orden y los anclajes del artículo; el índice (TOC) y el
// contenido se derivan de aquí para que página y test de paridad i18n coincidan.
export const TERMINOS_SECTIONS = [
  'proposito',
  'datos',
  'permisos',
  'responsabilidad',
  'usoAceptable',
  'menores',
  'licencia',
  'cambios',
] as const

export const PRIVACIDAD_SECTIONS = [
  'responsable',
  'datos',
  'compras',
  'publicidad',
  'analitica',
  'permisos',
  'seguridad',
  'derechos',
  'menores',
  'cambios',
] as const

// Fechas mostradas al inicio de cada artículo; se actualizan al editar contenido.
export const TERMINOS_UPDATED = '05/09/2026'
export const PRIVACIDAD_UPDATED = '05/09/2026'