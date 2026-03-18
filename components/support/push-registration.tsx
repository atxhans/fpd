'use client'

import { useEffect } from 'react'

interface PushRegistrationProps {
  userId: string
}

/**
 * Invisible component — registers the service worker and subscribes to Web Push.
 * Mount this once per layout for authenticated users (both app and admin).
 */
export function PushRegistration({ userId }: PushRegistrationProps) {
  useEffect(() => {
    void register(userId)
  }, [userId])

  return null
}

async function register(userId: string) {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return

  try {
    const reg = await navigator.serviceWorker.register('/sw.js')
    await navigator.serviceWorker.ready

    const permission = await Notification.requestPermission()
    if (permission !== 'granted') return

    const existing = await reg.pushManager.getSubscription()
    const sub = existing ?? await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!),
    })

    await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sub.toJSON()),
    })
  } catch (err) {
    console.error('[push] registration failed', err)
  }
}

function urlBase64ToUint8Array(base64String: string): ArrayBuffer {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  const buffer = new ArrayBuffer(rawData.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < rawData.length; i++) view[i] = rawData.charCodeAt(i)
  return buffer
}
