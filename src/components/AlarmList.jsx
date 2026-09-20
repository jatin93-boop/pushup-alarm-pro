import React, { useState } from 'react';
import { Plus, Bell, Trash2, Edit3, Dumbbell, Volume2, Check, X, UserCheck } from 'lucide-react';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const AlarmList = ({ alarms = [], onAddAlarm, onUpdateAlarm, onDeleteAlarm, onTestSpecificAlarm }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAlarm, setEditingAlarm] = useState(null);

  const [time, setTime] = useState('07:00');
  const [label, setLabel] = useState('Morning Workout Wake-Up');
  const [exerciseType, setExerciseType] = useState('pushups');
  const [targetReps, setTargetReps] = useState(10);
  const [soundType, setSoundType] = useState('siren');
  const [voiceCoach, setVoiceCoach] = useState('drill');
  const [repeatDays, setRepeatDays] = useState(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);

  const openAddModal = () => {
    setEditingAlarm(null);
    setTime('07:00');
    setLabel('Morning Workout Wake-Up');
    setExerciseType('pushups');
    setTargetReps(10);
    setSoundType('siren');
    setVoiceCoach('drill');
    setRepeatDays(['Mon', 'Tue', 'Wed', 'Thu', 'Fri']);
    setIsModalOpen(true);
  };

  const openEditModal = (alarm) => {
    setEditingAlarm(alarm);
    setTime(alarm.time);
    setLabel(alarm.label || 'Alarm');
    setExerciseType(alarm.exerciseType || 'pushups');
    setTargetReps(alarm.targetReps || 10);
    setSoundType(alarm.soundType || 'siren');
    setVoiceCoach(alarm.voiceCoach || 'drill');
    setRepeatDays(alarm.repeatDays || []);
    setIsModalOpen(true);
  };

  const toggleDay = (day) => {
    if (repeatDays.includes(day)) {
      setRepeatDays(repeatDays.filter(d => d !== day));
    } else {
      setRepeatDays([...repeatDays, day]);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    const alarmData = {
      id: editingAlarm ? editingAlarm.id : Date.now().toString(),
      time,
      label,
      exerciseType,
      targetReps: parseInt(targetReps, 10) || 10,
      soundType,
      voiceCoach,
      repeatDays,
      enabled: true
    };

    if (editingAlarm) {
      onUpdateAlarm(alarmData);
    } else {
      onAddAlarm(alarmData);
    }
    setIsModalOpen(false);
  };

  return (
    <div className="alarm-list-container">
      <div className="section-header">
        <h2 className="section-title">
          <Bell size={22} className="section-icon" /> Configured Alarms
        </h2>
        <button className="btn btn-primary btn-sm" onClick={openAddModal}>
          <Plus size={16} /> Add Alarm
        </button>
      </div>

      {alarms.length === 0 ? (
        <div className="empty-alarms-card">
          <Dumbbell size={40} className="empty-icon" />
          <h3>No Alarms Set</h3>
          <p>Create your first alarm to start waking up with AI pushups or squats!</p>
          <button className="btn btn-primary" onClick={openAddModal}>
            <Plus size={16} /> Create Alarm
          </button>
        </div>
      ) : (
        <div className="alarm-cards-grid">
          {alarms.map(alarm => (
            <div key={alarm.id} className={`alarm-card ${alarm.enabled ? 'active' : 'disabled'}`}>
              <div className="alarm-card-header">
                <div className="alarm-time">{alarm.time}</div>
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={alarm.enabled} 
                    onChange={() => onUpdateAlarm({ ...alarm, enabled: !alarm.enabled })} 
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="alarm-card-body">
                <div className="alarm-label">{alarm.label}</div>
                <div className="alarm-specs">
                  <span className="spec-badge reps-badge">
                    <Dumbbell size={14} /> {alarm.targetReps} {(alarm.exerciseType || 'pushups').replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="spec-badge sound-badge">
                    <UserCheck size={14} /> {(alarm.voiceCoach || 'drill').toUpperCase()} COACH
                  </span>
                </div>

                <div className="alarm-days">
                  {DAYS_OF_WEEK.map(day => (
                    <span 
                      key={day} 
                      className={`day-chip ${alarm.repeatDays?.includes(day) ? 'active' : ''}`}
                    >
                      {day[0]}
                    </span>
                  ))}
                </div>
              </div>

              <div className="alarm-card-actions">
                <button 
                  className="btn-icon" 
                  title="Test Alarm" 
                  onClick={() => onTestSpecificAlarm(alarm)}
                >
                  ⚡ Test
                </button>
                <button 
                  className="btn-icon" 
                  title="Edit Alarm" 
                  onClick={() => openEditModal(alarm)}
                >
                  <Edit3 size={16} />
                </button>
                <button 
                  className="btn-icon danger" 
                  title="Delete Alarm" 
                  onClick={() => onDeleteAlarm(alarm.id)}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-header">
              <h3>{editingAlarm ? 'Edit Alarm' : 'Set New Alarm'}</h3>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSave} className="alarm-form">
              <div className="form-group">
                <label>Alarm Time</label>
                <input 
                  type="time" 
                  className="form-input time-input"
                  value={time} 
                  onChange={e => setTime(e.target.value)}
                  required 
                />
              </div>

              <div className="form-group">
                <label>Alarm Label</label>
                <input 
                  type="text" 
                  className="form-input"
                  value={label} 
                  onChange={e => setLabel(e.target.value)}
                  placeholder="e.g. Morning Workout"
                  required 
                />
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>AI Exercise Type</label>
                  <select 
                    className="form-select"
                    value={exerciseType} 
                    onChange={e => setExerciseType(e.target.value)}
                  >
                    <option value="pushups">🏋️ Push-Ups</option>
                    <option value="squats">🦵 Squats</option>
                    <option value="jumping_jacks">⭐ Jumping Jacks</option>
                    <option value="plank">🧘 Plank Hold (Seconds)</option>
                  </select>
                </div>

                <div className="form-group half">
                  <label>Target Reps / Seconds</label>
                  <input 
                    type="number" 
                    min="1"
                    max="100"
                    className="form-input"
                    value={targetReps} 
                    onChange={e => setTargetReps(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group half">
                  <label>Alarm Siren Sound</label>
                  <select 
                    className="form-select"
                    value={soundType} 
                    onChange={e => setSoundType(e.target.value)}
                  >
                    <option value="siren">🚨 Emergency Siren</option>
                    <option value="buzzer">⚡ Cyber Buzzer</option>
                    <option value="pulse">🔊 High Pulse</option>
                    <option value="classic">⏰ Classic Beep</option>
                  </select>
                </div>

                <div className="form-group half">
                  <label>AI Voice Coach</label>
                  <select 
                    className="form-select"
                    value={voiceCoach} 
                    onChange={e => setVoiceCoach(e.target.value)}
                  >
                    <option value="drill">🎖️ Drill Sergeant</option>
                    <option value="yogi">🧘 Zen Yogi</option>
                    <option value="hype">🎧 Hype DJ</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Repeat Days</label>
                <div className="days-selector">
                  {DAYS_OF_WEEK.map(day => (
                    <button
                      key={day}
                      type="button"
                      className={`day-select-btn ${repeatDays.includes(day) ? 'selected' : ''}`}
                      onClick={() => toggleDay(day)}
                    >
                      {day}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={18} /> Save Alarm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AlarmList;
