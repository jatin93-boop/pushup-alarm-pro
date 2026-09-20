// Native Local Notifications & Web Notifications Scheduler for RepRise

import { LocalNotifications } from '@capacitor/local-notifications';

class NotificationScheduler {
  constructor() {
    this.isCapacitor = typeof window !== 'undefined' && window.Capacitor !== undefined;
    this.hasPermission = false;
  }

  async requestPermissions() {
    try {
      // 1. Web Browser Notifications Permission
      if (typeof window !== 'undefined' && 'Notification' in window) {
        if (Notification.permission === 'granted') {
          this.hasPermission = true;
        } else if (Notification.permission !== 'denied') {
          const perm = await Notification.requestPermission();
          this.hasPermission = perm === 'granted';
        }
      }

      // 2. Capacitor Native Local Notifications Permission (Android / iOS)
      if (this.isCapacitor) {
        const status = await LocalNotifications.requestPermissions();
        if (status.display === 'granted') {
          this.hasPermission = true;
        }
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
    return this.hasPermission;
  }

  // Schedule native OS notification for an alarm
  async scheduleAlarmNotification(alarm) {
    if (!alarm || !alarm.enabled) return;

    try {
      await this.requestPermissions();

      const [hours, minutes] = alarm.time.split(':').map(Number);
      const now = new Date();
      let alarmDate = new Date();

      alarmDate.setHours(hours, minutes, 0, 0);

      // If time passed today, set for tomorrow
      if (alarmDate.getTime() <= now.getTime()) {
        alarmDate.setDate(alarmDate.getDate() + 1);
      }

      // Native Capacitor Mobile Notification (Android / iOS)
      if (this.isCapacitor) {
        // Cancel existing notification for this alarm ID
        const notificationId = parseInt(alarm.id, 10) || Math.floor(Math.random() * 100000);
        
        try {
          await LocalNotifications.cancel({ notifications: [{ id: notificationId }] });
        } catch (err) {}

        await LocalNotifications.schedule({
          notifications: [
            {
              title: `🚨 ALARM: ${alarm.label || 'Wake Up Time!'}`,
              body: `Do ${alarm.targetReps || 10} Push-ups to stop the alarm! Tap to open RepRise.`,
              id: notificationId,
              schedule: { at: alarmDate },
              sound: 'res://raw/alarm_sound', // native alarm sound
              attachments: [],
              actionTypeId: '',
              extra: { alarmId: alarm.id }
            }
          ]
        });
      }
    } catch (e) {
      console.warn('Failed to schedule native notification:', e);
    }
  }

  // Send immediate Web Browser System Notification if tab is in background
  sendBrowserNotification(title, body) {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission === 'granted') {
      try {
        const notif = new Notification(title, {
          body,
          icon: '/favicon.svg',
          requireInteraction: true // Stays on screen until user interacts
        });
        notif.onclick = () => {
          window.focus();
        };
      } catch (e) {
        console.warn('Browser notification error:', e);
      }
    }
  }
}

export const notificationScheduler = new NotificationScheduler();
