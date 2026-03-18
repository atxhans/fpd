import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/server'

// Strip "=" padding — web-push requires unpadded URL-safe base64
function stripPadding(key: string) {
  return key.replace(/=+$/, '')
}

/**
 * Send a push notification to all active subscriptions for a user.
 * Never throws — push failures must not break the calling operation.
 */
export async function sendPushToUser(
  userId: string,
  payload: { title: string; body: string; url?: string },
): Promise<void> {
  try {
    webpush.setVapidDetails(
      'mailto:support@fieldpiecedigital.com',
      stripPadding(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? ''),
      stripPadding(process.env.VAPID_PRIVATE_KEY ?? ''),
    )

    const admin = await createAdminClient()
    const { data: subs } = await admin
      .from('push_subscriptions')
      .select('endpoint, p256dh, auth')
      .eq('user_id', userId)

    if (!subs?.length) return

    await Promise.allSettled(
      subs.map(sub =>
        webpush
          .sendNotification(
            { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
            JSON.stringify(payload),
          )
          .catch(async err => {
            // 410 Gone = subscription expired; remove it
            if (err.statusCode === 410) {
              await admin.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
            }
          }),
      ),
    )
  } catch (err) {
    console.error('[push] sendPushToUser failed', err)
  }
}
