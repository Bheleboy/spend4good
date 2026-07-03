import { useState, useEffect } from 'react'

export function useCountry() {
  const [isSA, setIsSA] = useState(true) // default SA until detected
  const [country, setCountry] = useState('ZA')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Use Cloudflare's free country detection via a lightweight fetch
    // Falls back to SA if detection fails
    fetch('https://cloudflare-quic.com/b/headers')
      .then((r) => r.json())
      .then((data: any) => {
        const cc = data?.headers?.['cf-ipcountry'] ?? 'ZA'
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
