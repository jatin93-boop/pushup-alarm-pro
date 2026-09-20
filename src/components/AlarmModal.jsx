import React, { useState, useEffect, useRef } from 'react';
import PushupDetector from './PushupDetector';
import { audioEngine } from '../utils/audioSynth';
import confetti from 'canvas-confetti';
import { ShieldAlert, Trophy, Volume2, CheckCircle, Zap } from 'lucide-react';

const AlarmModal = ({ alarm, onDismiss, isTestMode = false }) => {
  const [currentReps, setCurrentReps] = useState(0);
  const targetReps = alarm?.targetReps || 10;
  const soundType = alarm?.soundType || 'siren';
  
  const [isDismissed, setIsDismissed] = useState(false);
  const [overrideHoldTime, setOverrideHoldTime] = useState(0);
  const overrideTimerRef = useRef(null);

  // Start alarm audio on mount - Mute option disabled (Must complete pushups to turn off sound)
  useEffect(() => {
    audioEngine.startAlarm(soundType);

    return () => {
      audioEngine.stopAlarm();
    };
  }, [soundType]);

  // Handle rep increment from detector
  const handleRepComplete = (newRepCount) => {
    setCurrentReps(newRepCount);
    // Play pleasant rep chime & voice count
    audioEngine.playRepChime(newRepCount);
  };

  // Handle target reps achieved (e.g. 10 pushups completed)
  const handleGoalReached = () => {
    setIsDismissed(true);
    audioEngine.stopAlarm();
    audioEngine.playVictoryFanfare();

    // Trigger confetti explosion
    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 }
    });
  };

  // Emergency override button (Must press and hold for 10 seconds to bypass)
  const startOverrideHold = () => {
    setOverrideHoldTime(0);
    overrideTimerRef.current = setInterval(() => {
      setOverrideHoldTime((prev) => {
        if (prev >= 9) {
          clearInterval(overrideTimerRef.current);
          handleGoalReached();
          return 10;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const stopOverrideHold = () => {
    if (overrideTimerRef.current) {
      clearInterval(overrideTimerRef.current);
      overrideTimerRef.current = null;
    }
    setOverrideHoldTime(0);
  };

  return (
    <div className={`alarm-modal-overlay ${isDismissed ? 'dismissed-state' : ''}`}>
      <div className="alarm-modal-container">

        {/* Victory Screen when goal achieved */}
        {isDismissed ? (
          <div className="victory-card">
            <div className="victory-icon-wrapper">
              <Trophy size={64} className="victory-trophy-icon" />
            </div>
            <h2>WAKE-UP GOAL ACHIEVED!</h2>
            <p className="victory-subtitle">
              You completed <strong>{targetReps} Push-Ups</strong>! Your alarm is dismissed and your mind is wide awake.
            </p>

            <div className="victory-stats-badge">
              <div className="stat-num">{targetReps}</div>
              <div className="stat-label">Pushups Completed</div>
            </div>

            <button className="btn btn-victory-close" onClick={onDismiss}>
              <CheckCircle size={20} /> Finish & Close Alarm
            </button>
          </div>
        ) : (
          /* Active Ringing Alarm Takeover Screen */
          <>
            <div className="alarm-header-pulse">
              <div className="alarm-badge">
                <ShieldAlert className="pulse-icon" size={24} />
                <span>{isTestMode ? 'TEST ALARM MODE' : 'ALARM RINGING'}</span>
              </div>
              <h1 className="alarm-title">{alarm?.label || 'Wake Up Time!'}</h1>
              <p className="alarm-instruction">
                Do <strong className="highlight-text">{targetReps} Push-Ups</strong> in front of the camera to turn off this alarm!
              </p>
            </div>

            {/* Live Camera Pushup Detector */}
            <PushupDetector 
              targetReps={targetReps}
              currentReps={currentReps}
              onRepComplete={handleRepComplete}
              onGoalReached={handleGoalReached}
            />

            {/* Locked Sound Status & Emergency Hold Controls */}
            <div className="alarm-footer-controls">
              <div className="sound-active-badge">
                <Volume2 size={16} className="spin-icon" />
                <span>SOUND LOCKED (DO PUSHUPS TO STOP)</span>
              </div>

              <div className="emergency-override-wrapper">
                <button 
                  className="btn btn-emergency" 
                  onMouseDown={startOverrideHold}
                  onMouseUp={stopOverrideHold}
                  onMouseLeave={stopOverrideHold}
                  onTouchStart={startOverrideHold}
                  onTouchEnd={stopOverrideHold}
                >
                  <Zap size={16} /> Hold 10s for Emergency Override ({overrideHoldTime}/10s)
                </button>
                {overrideHoldTime > 0 && (
                  <div className="override-progress-bar" style={{ width: `${(overrideHoldTime / 10) * 100}%` }} />
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AlarmModal;
