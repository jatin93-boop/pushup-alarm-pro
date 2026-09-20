import React, { useState, useEffect } from 'react';
import ClockDisplay from './components/ClockDisplay';
import AlarmList from './components/AlarmList';
import AlarmModal from './components/AlarmModal';
import StatsView from './components/StatsView';
import { audioEngine } from './utils/audioSynth';
import { Dumbbell, Clock, Trophy, ShieldAlert, Volume2 } from 'lucide-react';

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

  // Save alarms & history to localStorage
  useEffect(() => {
    localStorage.setItem('pushup_alarms', JSON.stringify(alarms));
  }, [alarms]);

  useEffect(() => {
    localStorage.setItem('pushup_history', JSON.stringify(history));
  }, [history]);

  // Unlock Audio Engine on first interaction
  const enableAudioEngine = () => {
    audioEngine.initContext();
    setAudioEngineReady(true);
  };

  // Background Alarm Checker loop (runs every second)
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeRingingAlarm) return; // Alarm already active

      const now = new Date();
      const currentHoursStr = now.getHours().toString().padStart(2, '0');
      const currentMinsStr = now.getMinutes().toString().padStart(2, '0');
      const timeStr = `${currentHoursStr}:${currentMinsStr}`;

      // Prevent triggering multiple times in the same minute
      if (timeStr === lastTriggeredTimeStr) return;

      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const todayName = dayNames[now.getDay()];

      const matchedAlarm = alarms.find(a => {
        if (!a.enabled) return false;
        if (a.time !== timeStr) return false;
        // If repeat days configured, must include today
        if (a.repeatDays && a.repeatDays.length > 0 && !a.repeatDays.includes(todayName)) {
          return false;
        }
        return true;
      });

      if (matchedAlarm) {
        setLastTriggeredTimeStr(timeStr);
        triggerAlarm(matchedAlarm, false);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [alarms, activeRingingAlarm, lastTriggeredTimeStr]);

  const triggerAlarm = (alarmItem, testMode = false) => {
    enableAudioEngine();
    setIsTestMode(testMode);
    setActiveRingingAlarm(alarmItem);
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
          <span className="brand-title">PushUp<span className="brand-highlight">Alarm</span> Pro</span>
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
          <Volume2 size={18} /> Tap anywhere to enable Alarm Audio Engine
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
