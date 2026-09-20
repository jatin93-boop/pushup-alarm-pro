import React, { useState, useEffect } from 'react';
import { Clock, Zap, Volume2, Plus, Flame } from 'lucide-react';
import { audioEngine } from '../utils/audioSynth';

const ClockDisplay = ({ alarms = [], onTestAlarm, onAddAlarmClick }) => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Calculate upcoming alarm
  const getNextAlarmInfo = () => {
    const activeAlarms = alarms.filter(a => a.enabled);
    if (activeAlarms.length === 0) return null;

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();

    let upcoming = null;
    let minDiff = Infinity;

    activeAlarms.forEach(alarm => {
      const [h, m] = alarm.time.split(':').map(Number);
      let alarmMinutes = h * 60 + m;

      if (alarmMinutes <= currentMinutes) {
        alarmMinutes += 24 * 60; // next day
      }

      const diff = alarmMinutes - currentMinutes;
      if (diff < minDiff) {
        minDiff = diff;
        upcoming = { alarm, diffMinutes: diff };
      }
    });

    if (!upcoming) return null;

    const hoursLeft = Math.floor(upcoming.diffMinutes / 60);
    const minsLeft = upcoming.diffMinutes % 60;

    return {
      label: upcoming.alarm.label || 'Alarm',
      timeStr: upcoming.alarm.time,
      countdownStr: hoursLeft > 0 ? `${hoursLeft}h ${minsLeft}m` : `${minsLeft} mins`
    };
  };

  const nextAlarm = getNextAlarmInfo();

  const hours = time.getHours();
  const displayHours = (hours % 12 || 12).toString().padStart(2, '0');
  const minutes = time.getMinutes().toString().padStart(2, '0');
  const seconds = time.getSeconds().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';

  const dateOptions = { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' };
  const dateStr = time.toLocaleDateString(undefined, dateOptions);

  const playSoundPreview = () => {
    audioEngine.startAlarm('siren');
    setTimeout(() => {
      audioEngine.stopAlarm();
    }, 2500);
  };

  return (
    <div className="clock-display-card">
      <div className="clock-header">
        <div className="greeting-badge">
          <Flame size={18} className="streak-icon" />
          <span>REPRISE - EARN YOUR MORNING</span>
        </div>
        <div className="date-str">{dateStr}</div>
      </div>

      {/* Main Digital Clock */}
      <div className="digital-clock">
        <span className="clock-time">{displayHours}:{minutes}</span>
        <span className="clock-seconds">:{seconds}</span>
        <span className="clock-ampm">{ampm}</span>
      </div>

      {/* Upcoming Alarm Indicator */}
      {nextAlarm ? (
        <div className="upcoming-alarm-banner">
          <Clock size={16} />
          <span>Next Alarm ({nextAlarm.label} at {nextAlarm.timeStr}) in <strong>{nextAlarm.countdownStr}</strong></span>
        </div>
      ) : (
        <div className="upcoming-alarm-banner inactive">
          <Clock size={16} />
          <span>No active alarms set</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="clock-action-bar">
        <button className="btn btn-primary btn-glow" onClick={onTestAlarm}>
          <Zap size={18} /> Test 10 Pushups Challenge
        </button>

        <button className="btn btn-secondary" onClick={playSoundPreview}>
          <Volume2 size={18} /> Sound Test
        </button>

        <button className="btn btn-outline" onClick={onAddAlarmClick}>
          <Plus size={18} /> New Alarm
        </button>
      </div>
    </div>
  );
};

export default ClockDisplay;
