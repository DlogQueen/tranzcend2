import { useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';

type AlertType = 'report' | 'panic' | 'new_user' | 'chargeback' | 'hate_speech';

const ALERT_SOUNDS: Record<AlertType, string> = {
  panic: '🚨',
  hate_speech: '⚠️',
  report: '🚩',
  chargeback: '💳',
  new_user: '👤',
};

function notify(title: string, body: string, type: AlertType) {
  if (!('Notification' in window)) return;
  if (Notification.permission !== 'granted') return;

  const n = new Notification(`${ALERT_SOUNDS[type]} ${title}`, {
    body,
    icon: '/logo.jpg',
    badge: '/logo.jpg',
    tag: type, // prevents duplicate stacking
    silent: type === 'new_user', // only new_user is truly silent
    requireInteraction: type === 'panic' || type === 'hate_speech', // stays until dismissed
  });

  // Auto-close non-critical after 6s
  if (type !== 'panic' && type !== 'hate_speech') {
    setTimeout(() => n.close(), 6000);
  }

  n.onclick = () => {
    window.focus();
    window.location.href = '/admin';
    n.close();
  };
}

export function useAdminAlerts(isAdmin: boolean) {
  // Request permission on mount
  useEffect(() => {
    if (!isAdmin) return;
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [isAdmin]);

  const setupAlerts = useCallback(() => {
    if (!isAdmin) return;

    const channel = supabase.channel('admin-alerts')

      // 🚨 PANIC BUTTON - highest priority
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'stream_safety_events',
      }, (payload) => {
        const e = payload.new;
        if (e.event_type === 'emergency_stop' || e.event_type === 'panic_button') {
          notify(
            'PANIC BUTTON TRIGGERED',
            'A creator hit the emergency stop. Check immediately.',
            'panic'
          );
          // Also vibrate if on mobile
          if ('vibrate' in navigator) navigator.vibrate([500, 200, 500, 200, 500]);
        }
      })

      // ⚠️ CRITICAL REPORTS - hate speech, transphobia
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'reports',
      }, (payload) => {
        const r = payload.new;
        if (r.severity === 'critical') {
          notify(
            'Critical Report Filed',
            `Category: ${r.category}. Needs immediate review.`,
            'hate_speech'
          );
        } else if (r.severity === 'high') {
          notify(
            'High Priority Report',
            `${r.category} reported. Review soon.`,
            'report'
          );
        }
      })

      // 💳 CHARGEBACK / FRAUD
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'transactions',
      }, (payload) => {
        const t = payload.new;
        if (t.type === 'chargeback' || t.type === 'fraud') {
          notify(
            'Chargeback Alert',
            `Possible fraud detected. Amount: $${Math.abs(t.amount).toFixed(2)}`,
            'chargeback'
          );
        }
      })

      // 👤 NEW USER SIGNUP (silent)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'profiles',
      }, (payload) => {
        const p = payload.new;
        notify(
          'New Member Joined',
          `@${p.username || 'unknown'} just signed up`,
          'new_user'
        );
      })

      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [isAdmin]);

  useEffect(() => {
    const cleanup = setupAlerts();
    return cleanup;
  }, [setupAlerts]);
}
