// Párrafo de contacto legal: el cuerpo ya nombra el email, así que se parte
// por ese texto para que el propio email sea el link mailto sin repetirlo.
import { CONTACT_EMAIL } from '@/config/contact'

export const LegalContact = ({ cuerpo }: { cuerpo: string }) => {
  const [before, after = ''] = cuerpo.split(CONTACT_EMAIL)

  return (
    <p>
      {before}
      <a
        href={`mailto:${CONTACT_EMAIL}`}
        className="break-all text-accent-soft underline decoration-accent/40 underline-offset-2"
      >
        {CONTACT_EMAIL}
      </a>
      {after}
    </p>
  )
}
