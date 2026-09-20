// Audio Engine & AI Voice Coach Personalities for RepRise

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.alarmOscillator1 = null;
    this.alarmOscillator2 = null;
    this.alarmGain = null;
    this.lfoOscillator = null;
    this.isPlayingAlarm = false;
    this.soundType = 'siren';
    this.voiceCoach = 'drill'; // 'drill', 'yogi', 'hype', 'classic'
    this.phaseTimer = null;
    this.isPhase2Siren = false;
    this.speechSynth = typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  }

  initContext() {
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  setVoiceCoach(coach = 'drill') {
    this.voiceCoach = coach;
  }

  // 2-Phase Progressive Alarm: Gentle Nature Chimes ➔ Emergency Siren
  startAlarm(type = 'siren', coach = 'drill') {
    this.initContext();
    if (!this.audioCtx) return;
    if (this.isPlayingAlarm) this.stopAlarm();

    this.soundType = type;
    this.voiceCoach = coach;
    this.isPlayingAlarm = true;
    this.isPhase2Siren = false;

    // Start Phase 1: Gentle Chime
    this.startGentlePhase();

    // Escalates to Phase 2 Emergency Siren after 30 seconds
    this.phaseTimer = setTimeout(() => {
      if (this.isPlayingAlarm) {
        this.isPhase2Siren = true;
        this.speakCoach("Time is up! Emergency Siren activated! Start your reps now!");
        this.startEmergencySiren(type);
      }
    }, 30000);
  }

  startGentlePhase() {
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    this.alarmGain = this.audioCtx.createGain();
    this.alarmGain.gain.setValueAtTime(0.3, now);
    this.alarmGain.connect(this.audioCtx.destination);

    // Soft organic triangle synth wave
    this.alarmOscillator1 = this.audioCtx.createOscillator();
    this.alarmOscillator1.type = 'triangle';
    this.alarmOscillator1.frequency.setValueAtTime(440, now); // A4 note

    this.lfoOscillator = this.audioCtx.createOscillator();
    this.lfoOscillator.type = 'sine';
    this.lfoOscillator.frequency.setValueAtTime(1.5, now);

    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.setValueAtTime(80, now);
    this.lfoOscillator.connect(lfoGain);
    lfoGain.connect(this.alarmOscillator1.frequency);

    this.alarmOscillator1.connect(this.alarmGain);
    this.alarmOscillator1.start(now);
    this.lfoOscillator.start(now);

    this.speakCoach("Good morning! Time to rise and earn your day!");
  }

  startEmergencySiren(type = 'siren') {
    this.stopAudioNodes();
    if (!this.audioCtx) return;
    const now = this.audioCtx.currentTime;

    this.alarmGain = this.audioCtx.createGain();
    this.alarmGain.gain.setValueAtTime(0.8, now);
    this.alarmGain.connect(this.audioCtx.destination);

    this.alarmOscillator1 = this.audioCtx.createOscillator();
    this.alarmOscillator1.type = 'sawtooth';
    this.alarmOscillator1.frequency.setValueAtTime(700, now);

    this.lfoOscillator = this.audioCtx.createOscillator();
    this.lfoOscillator.type = 'sine';
    this.lfoOscillator.frequency.setValueAtTime(3.5, now);

    const lfoGain = this.audioCtx.createGain();
    lfoGain.gain.setValueAtTime(500, now);
    this.lfoOscillator.connect(lfoGain);
    lfoGain.connect(this.alarmOscillator1.frequency);

    this.alarmOscillator1.connect(this.alarmGain);
    this.alarmOscillator1.start(now);
    this.lfoOscillator.start(now);
  }

  stopAudioNodes() {
    try {
      if (this.alarmOscillator1) {
        this.alarmOscillator1.stop();
        this.alarmOscillator1.disconnect();
        this.alarmOscillator1 = null;
      }
      if (this.alarmOscillator2) {
        this.alarmOscillator2.stop();
        this.alarmOscillator2.disconnect();
        this.alarmOscillator2 = null;
      }
      if (this.lfoOscillator) {
        this.lfoOscillator.stop();
        this.lfoOscillator.disconnect();
        this.lfoOscillator = null;
      }
    } catch (e) {}
  }

  stopAlarm() {
    this.isPlayingAlarm = false;
    if (this.phaseTimer) {
      clearTimeout(this.phaseTimer);
      this.phaseTimer = null;
    }
    this.stopAudioNodes();
  }

  playRepChime(repNumber = 1) {
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    const baseFreq = 523.25;
    const freq = baseFreq * (1 + (repNumber * 0.04));

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.4, now + 0.15);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.35);

    // Speak rep with selected coach personality
    this.speakCoachRep(repNumber);
  }

  playVictoryFanfare() {
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50];
    
    notes.forEach((freq, idx) => {
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      const startTime = now + (idx * 0.12);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, startTime);

      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(0.6, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.8);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(startTime);
      osc.stop(startTime + 0.8);
    });

    this.speakCoach("Victory! Goal achieved, alarm dismissed!");
  }

  // AI Voice Coach Personalities
  speakCoachRep(repNumber) {
    let msg = `${repNumber}!`;

    if (this.voiceCoach === 'drill') {
      const drillPhrases = [
        `${repNumber}! Push hard cadet!`,
        `${repNumber}! Drive it up!`,
        `${repNumber}! No excuses!`,
        `${repNumber}! Feel the burn!`,
        `${repNumber}! Strong form!`
      ];
      msg = drillPhrases[(repNumber - 1) % drillPhrases.length];
    } else if (this.voiceCoach === 'yogi') {
      msg = `Breathe in... ${repNumber}. Beautiful depth.`;
    } else if (this.voiceCoach === 'hype') {
      msg = `Boom! ${repNumber}! Keep that energy up!`;
    }

    this.speakCoach(msg);
  }

  speakCoach(text) {
    if (!this.speechSynth) return;
    try {
      this.speechSynth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      
      if (this.voiceCoach === 'drill') {
        utterance.rate = 1.3;
        utterance.pitch = 0.8;
      } else if (this.voiceCoach === 'yogi') {
        utterance.rate = 0.95;
        utterance.pitch = 1.2;
      } else if (this.voiceCoach === 'hype') {
        utterance.rate = 1.4;
        utterance.pitch = 1.3;
      }
      
      this.speechSynth.speak(utterance);
    } catch (e) {}
  }
}

export const audioEngine = new AudioEngine();
