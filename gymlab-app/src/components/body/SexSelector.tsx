// Selector de sexo para la composición corporal: persistencia en meta, autocontenido (sin props).
// Idéntico en medidas y grasa; vive en un solo sitio.
import { useTranslation } from 'react-i18next'
import { FilterChips } from '@/components/ui/FilterChips'
import { useMetaValue } from '@/hooks/useMetaValue'
import { metaRepo } from '@/data/repositories'
import { BODY_SEX_KEY } from '@/domain/profileMeta'
import { SEX_LABELS } from '@/domain/bodyMeasurements'
import type { Sex } from '@/domain/types'

export const SexSelector = () => {
  const { t } = useTranslation()
  const sex = useMetaValue<Sex>(BODY_SEX_KEY, 'male')

  return (
    <FilterChips<'male' | 'female'>
      options={(['male', 'female'] as Sex[]).map((s) => ({ value: s, label: SEX_LABELS[s] }))}
      value={sex}
      onChange={(s) => {
        if (s) void metaRepo.setJson(BODY_SEX_KEY, s)
      }}
      ariaLabel={t('comun.sexo')}
      allowDeselect={false}
      grow
      className="gap-2"
    />
  )
}