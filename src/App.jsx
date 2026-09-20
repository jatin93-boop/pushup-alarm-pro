import React, { useState, useEffect } from 'react';
import ClockDisplay from './components/ClockDisplay';
import AlarmList from './components/AlarmList';
import AlarmModal from './components/AlarmModal';
import StatsView from './components/StatsView';
import { audioEngine } from './utils/audioSynth';
import { notificationScheduler } from './utils/notificationScheduler';
import { Dumbbell, Clock, Trophy, ShieldAlert, Volume2, Bell } from 'lucide-react';
import { LocalNotifications } from '@capacitor/local-notifications';

const DEFAULT_ALARMS = [
  {
    id: '1',
    time: '07:00',
    label: 'Morning Workout Wake-Up',
    targetReps: 10,
    soundType: 'siren',
    repeatDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
    enabled: true
  },
  {
    id: '2',
    time: '08:30',
    label: 'Morning Stretch & Pushups',
    targetReps: 15,
    soundType: 'buzzer',
    repeatDays: ['Sat', 'Sun'],
    enabled: false
  }
];

const App = () => {
  const [alarms, setAlarms] = useState(() => {
    const saved = localStorage.getItem('pushup_alarms');
    return saved ? JSON.parse(saved) : DEFAULT_ALARMS;
  });

  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('pushup_history');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState('clock'); // 'clock', 'stats'
  const [activeRingingAlarm, setActiveRingingAlarm] = useState(null);
  const [isTestMode, setIsTestMode] = useState(false);
  const [audioEngineReady, setAudioEngineReady] = useState(false);
  const [lastTriggeredTimeStr, setLastTriggeredTimeStr] = useState('');
  const [notificationsGranted, setNotificationsGranted] = useState(false);

  // Save alarms & history to localStorage and schedule native local notifications
  useEffect(() => {
    localStorage.setItem('pushup_alarms', JSON.stringify(alarms));
    
    // Schedule native OS notifications for active alarms
    alarms.forEach(alarm => {
      if (alarm.enabled) {
        notificationScheduler.scheduleAlarmNotification(alarm);
      }
    });
  }, [alarms]);

  useEffect(() => {
    localStorage.setItem('pushup_history', JSON.stringify(history));
  }, [history]);

  // Request notifications permission on start
  useEffect(() => {
    notificationScheduler.requestPermissions().then(granted => {
      setNotificationsGranted(granted);
    });

    // Listen for native Capacitor notification taps
    let listener = null;
    if (typeof window !== 'undefined' && window.Capacitor) {
      listener = LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        const extra = notification.notification.extra;
        if (extra && extra.alarmId) {
          const matched = alarms.find(a => a.id === extra.alarmId);
          if (matched) {
            triggerAlarm(matched, false);
          }
        }
      });
    }

    return () => {
      if (listener && listener.remove) {
        listener.remove();
      }
    };
  }, [alarms]);

  // Handle Page Visibility Change (Catch-up when phone is unlocked or tab is reopened)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !activeRingingAlarm) {
        checkAndTriggerCurrentAlarms();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [alarms, activeRingingAlarm]);

  // Unlock Audio Engine on first interaction
  const enableAudioEngine = () => {
    audioEngine.initContext();
    setAudioEngineReady(true);
    notificationScheduler.requestPermissions();
  };

  const checkAndTriggerCurrentAlarms = () => {
    const now = new Date();
    const currentHoursStr = now.getHours().toString().padStart(2, '0');
    const currentMinsStr = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${currentHoursStr}:${currentMinsStr}`;

    if (timeStr === lastTriggeredTimeStr) return;

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const todayName = dayNames[now.getDay()];

    const matchedAlarm = alarms.find(a => {
      if (!a.enabled) return false;
      if (a.time !== timeStr) return false;
      if (a.repeatDays && a.repeatDays.length > 0 && !a.repeatDays.includes(todayName)) {
        return false;
      }
      return true;
    });

    if (matchedAlarm) {
      setLastTriggeredTimeStr(timeStr);
      triggerAlarm(matchedAlarm, false);
    }
  };

  // Background Alarm Checker loop (runs every second)
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeRingingAlarm) return;
      checkAndTriggerCurrentAlarms();
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms, activeRingingAlarm, lastTriggeredTimeStr]);

  const triggerAlarm = (alarmItem, testMode = false) => {
    enableAudioEngine();
    setIsTestMode(testMode);
    setActiveRingingAlarm(alarmItem);

    // Also fire a system notification if running in background
    notificationScheduler.sendBrowserNotification(
      `🚨 ALARM: ${alarmItem.label || 'Wake Up Time!'}`,
      `Do ${alarmItem.targetReps || 10} Push-ups to stop the alarm!`
    );
  };

  // Trigger test alarm (10 pushups goal)
  const handleTestChallenge = () => {
    const testAlarm = {
      id: 'test',
      time: 'NOW',
      label: '⚡ 10 Pushups Challenge Test',
      targetReps: 10,
      soundType: 'siren',
      enabled: true
    };
    triggerAlarm(testAlarm, true);
  };

  const handleDismissAlarm = () => {
    if (activeRingingAlarm) {
      // Record history entry
      const now = new Date();
      const newEntry = {
        label: activeRingingAlarm.label,
        reps: activeRingingAlarm.targetReps || 10,
        dateStr: now.toLocaleDateString(),
        timeStr: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setHistory([newEntry, ...history]);
    }
    setActiveRingingAlarm(null);
    setIsTestMode(false);
  };

  const handleAddAlarm = (newAlarm) => {
    setAlarms([...alarms, newAlarm]);
  };

  const handleUpdateAlarm = (updatedAlarm) => {
    setAlarms(alarms.map(a => a.id === updatedAlarm.id ? updatedAlarm : a));
  };

  const handleDeleteAlarm = (id) => {
    setAlarms(alarms.filter(a => a.id !== id));
  };

  return (
    <div className="app-root" onClick={enableAudioEngine}>
      {/* Top Navbar */}
      <header className="app-navbar">
        <div className="brand-logo">
          <div className="logo-icon-bg">
            <Dumbbell size={22} className="brand-icon" />
          </div>
          <span className="brand-title">Rep<span className="brand-highlight">Rise</span></span>
        </div>

        <nav className="nav-tabs">
          <button 
            className={`tab-btn ${activeTab === 'clock' ? 'active' : ''}`}
            onClick={() => setActiveTab('clock')}
          >
            <Clock size={18} /> Clock & Alarms
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            <Trophy size={18} /> Workout Stats
          </button>
        </nav>
      </header>

      {/* Enable Audio Engine Warning Banner if context suspended */}
      {!audioEngineReady && (
        <div className="audio-banner" onClick={enableAudioEngine}>
          <Volume2 size={18} /> Tap anywhere to activate Alarm Audio & Notification Engine
        </div>
      )}

      {/* Main View Area */}
      <main className="main-wrapper">
        {activeTab === 'clock' ? (
          <div className="tab-view-grid">
            <ClockDisplay 
              alarms={alarms}
              onTestAlarm={handleTestChallenge}
              onAddAlarmClick={() => {
                const alarmSection = document.querySelector('.alarm-list-container');
                alarmSection?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            <AlarmList 
              alarms={alarms}
              onAddAlarm={handleAddAlarm}
              onUpdateAlarm={handleUpdateAlarm}
              onDeleteAlarm={handleDeleteAlarm}
              onTestSpecificAlarm={(alarm) => triggerAlarm(alarm, true)}
            />
          </div>
        ) : (
          <StatsView history={history} />
        )}
      </main>

      {/* Full-Screen Ringing Alarm Lockdown Overlay */}
      {activeRingingAlarm && (
        <AlarmModal 
          alarm={activeRingingAlarm}
          isTestMode={isTestMode}
          onDismiss={handleDismissAlarm}
        />
      )}
    </div>
  );
};

export default App;
