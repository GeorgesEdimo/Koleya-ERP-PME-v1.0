import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

// Redirige vers une section précise de la page d'accueil (/fonctionnalites → /#fonctionnalites)
export default function RedirectToSection({ to }) {
  const navigate = useNavigate()

  useEffect(() => {
    navigate(`/#${to}`, { replace: true })
  }, [navigate, to])

  return null
}
