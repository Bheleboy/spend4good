import { initializePaddle, type Paddle } from '@paddle/paddle-js'
import { useEffect, useState } from 'react'

let paddleInstance: Paddle | undefined

export interface PaddleBillingDetails {
  addressLine1?: string
  city?: string
  postalCode?: string
  country?: string // ISO country code
}

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
    billingDetails?: PaddleBillingDetails
    onSuccess?: () => void
  }) => {
    if (!paddleInstance || !params.priceId) {
      console.error('Paddle not ready or missing priceId')
      return
    }
    const b = params.billingDetails
    const hasAddress = !!(b?.addressLine1 && b?.city && b?.postalCode && b?.country)
    const customer = params.email
      ? {
          email: params.email,
          ...(hasAddress
            ? {
                address: {
                  firstLine: b!.addressLine1!,
                  city: b!.city!,
                  postalCode: b!.postalCode!,
                  countryCode: b!.country!,
                },
              }
            : {}),
        }
      : undefined
    paddleInstance.Checkout.open({
      items: [{ priceId: params.priceId, quantity: 1 }],
      customer: customer as any,
      customData: params.customData,
      settings: {
        successUrl: `${window.location.origin}/login?checkout=success`,
      },
    })
  }

  return { openCheckout, ready }
}
