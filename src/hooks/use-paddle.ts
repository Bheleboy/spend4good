import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import { useEffect, useState } from 'react'

let paddleInstance: Paddle | undefined

export function usePaddle() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (paddleInstance) { setReady(true); return }
    initializePaddle({
      environment: (import.meta.env.VITE_PADDLE_ENVIRONMENT ?? 'sandbox') as 'sandbox' | 'production',
      token: import.meta.env.VITE_PADDLE_CLIENT_TOKEN,
    }).then((p) => {
      paddleInstance = p
      setReady(true)
    }).catch((err) => {
      console.error('Paddle init failed', err)
    })
  }, [])

  const openCheckout = (params: {
    priceId: string
    email?: string
    customData?: Record<string, string>
    onSuccess?: () => void
  }) => {
    if (!paddleInstance || !params.priceId) {
      console.error('Paddle not ready or missing priceId')
      return
    }
    paddleInstance.Checkout.open({
      items: [{ priceId: params.priceId, quantity: 1 }],
      customer: params.email ? { email: params.email } : undefined,
      customData: params.customData,
      settings: {
        successUrl: `${window.location.origin}/login?checkout=success`,
      },
    })
  }

  return { openCheckout, ready }
}
