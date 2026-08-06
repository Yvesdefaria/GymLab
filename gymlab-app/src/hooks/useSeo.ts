import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://gymlab.app'
const SITE_NAME = 'GymLab'

const DEFAULT_DESCRIPTION =
  'GymLab — planifica rutinas, registra tus series y usa calculadoras de fitness (IMC, calorías, macros y 1RM) basadas en evidencia.'

const ROUTE_META: Array<{ pattern: RegExp; description: string }> = [
  { pattern: /^\/rutinas\/nueva$/, description: 'Crea tu propia rutina de entrenamiento con ejercicios, series, reps y descanso en GymLab.' },
  { pattern: /^\/rutinas\//, description: 'Ficha completa de la rutina: objetivos, frecuencia, ejercicios y cómo seguirla en GymLab.' },
  { pattern: /^\/rutinas$/, description: 'Explora rutinas y programas de entrenamiento predefinidos y crea los tuyos en GymLab.' },
  { pattern: /^\/papers\//, description: 'Ficha del paper con autores, año, resumen y conclusiones prácticas para tu entrenamiento.' },
  { pattern: /^\/papers$/, description: 'Papers de fitness seleccionados por GymLab, con resumen y aplicación práctica basada en evidencia.' },
  { pattern: /^\/guias\//, description: 'Guía práctica de GymLab sobre nutrición, recuperación y bases del entrenamiento.' },
  { pattern: /^\/guias$/, description: 'Guías cortas de GymLab: nutrición, recuperación, deload y conceptos base del entrenamiento.' },
  { pattern: /^\/calculadoras\/imc$/, description: 'Calcula tu índice de masa corporal (OMS) e interpreta la categoría con la calculadora de IMC de GymLab.' },
  { pattern: /^\/calculadoras\/calorias$/, description: 'Calcula tu gasto energético diario (TDEE) y tus calorías de mantenimiento con GymLab.' },
  { pattern: /^\/calculadoras\/macros$/, description: 'Calcula tu distribución de macros (proteína, carbohidratos y grasas) según tu objetivo con GymLab.' },
  { pattern: /^\/calculadoras\/1rm$/, description: 'Estima tu fuerza máxima (1RM) a partir de una serie con la calculadora de repeticiones de GymLab.' },
  { pattern: /^\/calculadoras\/agua$/, description: 'Calcula tu hidratación diaria recomendada según peso, actividad y clima con la calculadora de GymLab.' },
  { pattern: /^\/calculadoras\/conversor$/, description: 'Convierte libras a kilos y kilos a libras para discos y cargas con la calculadora de GymLab.' },
  { pattern: /^\/calculadoras$/, description: 'Calculadoras de fitness de GymLab: IMC, calorías, macros, 1RM, agua y conversor de unidades.' },
  { pattern: /^\/ejercicios\//, description: 'Ficha del ejercicio: cómo ejecutarlo, grupos musculares y tu historial de fuerza con GymLab.' },
  { pattern: /^\/ejercicios$/, description: 'Biblioteca de ejercicios con filtros por grupo muscular, equipo y favoritos en GymLab.' },
  { pattern: /^\/entrenamiento\//, description: 'Sesión de entrenamiento activa en GymLab: registra series, descanso y progreso en tiempo real.' },
  { pattern: /^\/calendario$/, description: 'Calendario de entrenamientos en GymLab: días entrenados y planificados mes a mes.' },
  { pattern: /^\/cuerpo$/, description: 'Seguimiento de grupos musculares, volumen y fatiga por zona en GymLab.' },
  { pattern: /^\/peso-corporal$/, description: 'Registra y visualiza la evolución de tu peso corporal con la gráfica de GymLab.' },
  { pattern: /^\/perfil$/, description: 'Tu progreso en GymLab: volumen semanal, rachas, PRs e historial de entrenos.' },
  { pattern: /^\/ajustes$/, description: 'Configura GymLab: apariencia, paleta de color, modo claro/oscuro y preferencias de sesión.' },
]

const setMeta = (attr: 'name' | 'property', key: string, content: string) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export const useSeo = (title: string) => {
  const { pathname } = useLocation()

  useEffect(() => {
    const fullTitle = title ? `${title} · GymLab` : 'GymLab — Entrena mejor con datos'
    const meta = ROUTE_META.find((route) => route.pattern.test(pathname))
    const description = meta?.description ?? DEFAULT_DESCRIPTION
    const url = `${SITE_URL}${pathname}`

    document.title = fullTitle
    setMeta('name', 'description', description)
    setMeta('property', 'og:title', fullTitle)
    setMeta('property', 'og:description', description)
    setMeta('property', 'og:url', url)
    setMeta('property', 'og:image', `${SITE_URL}/logo.jpg`)
    setMeta('property', 'og:site_name', SITE_NAME)
    setMeta('name', 'twitter:title', fullTitle)
    setMeta('name', 'twitter:description', description)
    setMeta('name', 'twitter:image', `${SITE_URL}/logo.jpg`)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = url
  }, [title, pathname])
}
