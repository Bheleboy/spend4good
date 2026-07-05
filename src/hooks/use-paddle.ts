import { useEffect, useRef } from 'react'
import { initializePaddle, Paddle } from '@paddle/paddle-js'
import { type Plan } from '@/lib/pricing'

const PADDLE_CLIENT_TOKEN = import.meta.env.VITE_PADDLE_CLIENT_TOKEN
const PADDLE_ENVIRONMENT = import.meta.env.VITE_PADDLE_ENVIRONMENT

export function usePaddle() {
  const paddleRef = useRef<Paddle | null>(null)

  useEffect(() => {
    if (paddleRef.current) return
    if (!PADDLE_CLIENT_TOKEN) return

    initializePaddle({
      token: PADDLE_CLIENT_TOKEN,
      environment: PADDLE_ENVIRONMENT === 'production' ? 'production' : 'sandbox',
    }).then((paddle) => {
      if (paddle) paddleRef.current = paddle
    })
  }, [])

  const openCheckout = (plan: Plan, isSA: boolean) => {
    const paddle = paddleRef.current
    if (!paddle) {
      console.error('Paddle is not initialized')
      return
    }

    const priceId = isSA ? plan.paddlePriceIdZAR : plan.paddlePriceId

    paddle.Checkout.open({
      items: [{ priceId, quantity: 1 }],
    })
  }

  return { openCheckout }
}
