import { useState, useEffect } from 'react'

export function useCountry() {
  const [isSA, setIsSA] = useState(true) // default SA until detected
  const [country, setCountry] = useState('ZA')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('https://ipapi.co/json/')
      .then((r) => r.json())
      .then((data: any) => {
        const cc = data?.country_code ?? 'ZA'
        setCountry(cc)
        setIsSA(cc === 'ZA')
      })
      .catch(() => {
        // silently default to SA
        setIsSA(true)
        setCountry('ZA')
      })
      .finally(() => setLoading(false))
  }, [])

  return { isSA, country, loading }
}
