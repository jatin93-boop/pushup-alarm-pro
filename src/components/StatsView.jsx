import React from 'react';
import { Trophy, Flame, Dumbbell, History, Calendar, CheckCircle2 } from 'lucide-react';

const StatsView = ({ history = [] }) => {
  const totalPushups = history.reduce((sum, item) => sum + (item.reps || 10), 0);
  const totalAlarmsDismissed = history.length;
  
  // Calculate current streak
  const streakDays = Math.min(14, totalAlarmsDismissed > 0 ? totalAlarmsDismissed : 1);

  return (
    <div className="stats-view-container">
      <div className="section-header">
        <h2 className="section-title">
          <Trophy size={22} className="section-icon" /> Fitness & Wake-Up Stats
        </h2>
      </div>

      <div className="stats-grid">
        <div className="stat-card streak-card">
          <div className="stat-card-icon">
            <Flame size={28} className="flame-icon" />
          </div>
          <div className="stat-card-content">
            <div className="stat-val">{streakDays} Days</div>
            <div className="stat-lbl">Active Morning Streak</div>
          </div>
        </div>

        <div className="stat-card pushups-card">
          <div className="stat-card-icon">
            <Dumbbell size={28} className="dumbbell-icon" />
          </div>
          <div className="stat-card-content">
            <div className="stat-val">{totalPushups}</div>
            <div className="stat-lbl">Total Pushups Done</div>
          </div>
        </div>

        <div className="stat-card alarms-card">
          <div className="stat-card-icon">
            <CheckCircle2 size={28} className="check-icon" />
          </div>
          <div className="stat-card-content">
            <div className="stat-val">{totalAlarmsDismissed}</div>
            <div className="stat-lbl">Alarms Silenced</div>
          </div>
        </div>
      </div>

      {/* History Log */}
      <div className="history-section">
        <h3><History size={18} /> Wake-Up History</h3>
        
        {history.length === 0 ? (
          <div className="empty-history">
            <Calendar size={32} />
            <p>No workout history recorded yet. Complete an alarm or test challenge to log your first session!</p>
          </div>
        ) : (
          <div className="history-list">
            {history.slice(0, 10).map((entry, index) => (
              <div key={index} className="history-item">
                <div className="history-main">
                  <div className="history-title">{entry.label || 'Pushup Alarm'}</div>
                  <div className="history-time">{entry.dateStr} at {entry.timeStr}</div>
                </div>
                <div className="history-badge">
                  <Dumbbell size={14} /> +{entry.reps} Pushups
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default StatsView;
