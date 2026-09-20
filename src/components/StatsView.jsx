import React from 'react';
import { Trophy, Flame, Dumbbell, History, Calendar, CheckCircle2, Share2, Download, ShieldCheck } from 'lucide-react';

const StatsView = ({ history = [] }) => {
  const totalReps = history.reduce((sum, item) => sum + (item.reps || 10), 0);
  const totalAlarmsDismissed = history.length;
  
  const streakDays = Math.min(30, totalAlarmsDismissed > 0 ? totalAlarmsDismissed : 1);
  const totalXP = totalReps * 10 + totalAlarmsDismissed * 50;

  // Level Progression Math
  const level = Math.floor(totalXP / 200) + 1;
  const currentLevelXP = totalXP % 200;
  const levelProgress = Math.min(100, Math.round((currentLevelXP / 200) * 100));

  const getBadgeTitle = (lvl) => {
    if (lvl >= 10) return '🏆 Iron Titan';
    if (lvl >= 5) return '⚔️ Morning Gladiator';
    if (lvl >= 3) return '🔥 Rising Warrior';
    return '🌱 Morning Novice';
  };

  const shareToWhatsApp = () => {
    const text = `🔥 I just earned ${totalXP} XP and completed my morning wake-up streak on RepRise! Total reps: ${totalReps}! Check it out: https://reprise.vercel.app`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  const exportHealthData = () => {
    const jsonStr = JSON.stringify(history, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reprise_health_export_${Date.now()}.json`;
    a.click();
  };

  return (
    <div className="stats-view-container">
      <div className="section-header">
        <h2 className="section-title">
          <Trophy size={22} className="section-icon" /> Gamified Fitness & Wake-Up Stats
        </h2>
        <div className="header-actions">
          <button className="btn btn-secondary btn-sm" onClick={shareToWhatsApp}>
            <Share2 size={16} /> Share on WhatsApp
          </button>
          <button className="btn btn-outline btn-sm" onClick={exportHealthData}>
            <Download size={16} /> Export Health Data
          </button>
        </div>
      </div>

      {/* XP Level Progress Card */}
      <div className="level-card">
        <div className="level-header">
          <div className="level-badge">{getBadgeTitle(level)}</div>
          <div className="level-num">Level {level}</div>
        </div>
        <div className="xp-progress-bar-container">
          <div className="xp-bar-track">
            <div className="xp-bar-fill" style={{ width: `${levelProgress}%` }} />
          </div>
          <div className="xp-label">{currentLevelXP} / 200 XP to next level</div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card streak-card">
          <div className="stat-card-icon">
            <Flame size={28} className="flame-icon" />
          </div>
          <div className="stat-card-content">
            <div className="stat-val">{streakDays} Days</div>
            <div className="stat-lbl">Morning Streak</div>
          </div>
        </div>

        <div className="stat-card pushups-card">
          <div className="stat-card-icon">
            <Dumbbell size={28} className="dumbbell-icon" />
          </div>
          <div className="stat-card-content">
            <div className="stat-val">{totalReps}</div>
            <div className="stat-lbl">Total Exercise Reps</div>
          </div>
        </div>

        <div className="stat-card alarms-card">
          <div className="stat-card-icon">
            <CheckCircle2 size={28} className="check-icon" />
          </div>
          <div className="stat-card-content">
            <div className="stat-val">{totalXP}</div>
            <div className="stat-lbl">Total XP Earned</div>
          </div>
        </div>
      </div>

      <div className="history-section">
        <h3><History size={18} /> Morning History Log</h3>
        
        {history.length === 0 ? (
          <div className="empty-history">
            <Calendar size={32} />
            <p>No workout history recorded yet. Complete an alarm challenge to earn your first XP!</p>
          </div>
        ) : (
          <div className="history-list">
            {history.slice(0, 10).map((entry, index) => (
              <div key={index} className="history-item">
                <div className="history-main">
                  <div className="history-title">{entry.label || 'Morning Workout'}</div>
                  <div className="history-time">{entry.dateStr} at {entry.timeStr}</div>
                </div>
                <div className="history-badge">
                  <ShieldCheck size={14} /> +{entry.reps || 10} Reps (+100 XP)
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
