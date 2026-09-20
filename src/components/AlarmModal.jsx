import React, { useState, useEffect, useRef } from 'react';
import PushupDetector from './PushupDetector';
import { audioEngine } from '../utils/audioSynth';
import confetti from 'canvas-confetti';
import { ShieldAlert, Trophy, Volume2, CheckCircle, Zap } from 'lucide-react';

const AlarmModal = ({ alarm, onDismiss, isTestMode = false }) => {
  const [currentReps, setCurrentReps] = useState(0);
  const targetReps = alarm?.targetReps || 10;
  const soundType = alarm?.soundType || 'siren';
  const exerciseType = alarm?.exerciseType || 'pushups';
  const voiceCoach = alarm?.voiceCoach || 'drill';
  
  const [isDismissed, setIsDismissed] = useState(false);
  const [overrideHoldTime, setOverrideHoldTime] = useState(0);
  const overrideTimerRef = useRef(null);

  useEffect(() => {
    audioEngine.startAlarm(soundType, voiceCoach);

    return () => {
      audioEngine.stopAlarm();
    };
  }, [soundType, voiceCoach]);

  const handleRepComplete = (newRepCount) => {
    setCurrentReps(newRepCount);
    audioEngine.playRepChime(newRepCount);
  };

  const handleGoalReached = () => {
    setIsDismissed(true);
    audioEngine.stopAlarm();
    audioEngine.playVictoryFanfare();

    confetti({
      particleCount: 150,
      spread: 90,
      origin: { y: 0.6 }
    });
  };

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

        {isDismissed ? (
          <div className="victory-card">
            <div className="victory-icon-wrapper">
              <Trophy size={64} className="victory-trophy-icon" />
            </div>
            <h2>WAKE-UP GOAL ACHIEVED!</h2>
            <p className="victory-subtitle">
              You completed <strong>{targetReps} {exerciseType.replace('_', ' ').toUpperCase()}</strong>! Your alarm is dismissed and your mind is wide awake.
            </p>

            <div className="victory-stats-badge">
              <div className="stat-num">{targetReps}</div>
              <div className="stat-label">{exerciseType.replace('_', ' ').toUpperCase()} Completed</div>
            </div>

            <button className="btn btn-victory-close" onClick={onDismiss}>
              <CheckCircle size={20} /> Finish & Close Alarm
            </button>
          </div>
        ) : (
          <>
            <div className="alarm-header-pulse">
              <div className="alarm-badge">
                <ShieldAlert className="pulse-icon" size={24} />
                <span>{isTestMode ? 'TEST ALARM MODE' : 'ALARM RINGING'}</span>
              </div>
              <h1 className="alarm-title">{alarm?.label || 'Wake Up Time!'}</h1>
              <p className="alarm-instruction">
                Do <strong className="highlight-text">{targetReps} {exerciseType.replace('_', ' ').toUpperCase()}</strong> in front of the camera to turn off this alarm!
              </p>
            </div>

            <PushupDetector 
              exerciseType={exerciseType}
              targetReps={targetReps}
              currentReps={currentReps}
              onRepComplete={handleRepComplete}
              onGoalReached={handleGoalReached}
            />

            <div className="alarm-footer-controls">
              <div className="sound-active-badge">
                <Volume2 size={16} className="spin-icon" />
                <span>PROGRESSIVE SOUND ACTIVE ({voiceCoach.toUpperCase()} COACH)</span>
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
