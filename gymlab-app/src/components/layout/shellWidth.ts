// Tope de ancho de la app. La decisión de producto es la tablet más grande
// probada: 768px (portrait) / 1024px (landscape, donde el shell ya llena).
// Lo comparten el shell, la TabBar y las barras fijas para que el centrado y
// los bordes queden alineados en todos los anchos. Tests: e2e F99 B.4/B.5.
export const SHELL_MAX_W = 'max-w-lg md:max-w-3xl';
