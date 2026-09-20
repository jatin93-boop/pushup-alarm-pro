// Web Audio API & Speech Synthesis Sound Engine for PushUp Alarm Pro

class AudioEngine {
  constructor() {
    this.audioCtx = null;
    this.alarmOscillator1 = null;
    this.alarmOscillator2 = null;
    this.alarmGain = null;
    this.lfoOscillator = null;
    this.isPlayingAlarm = false;
    this.soundType = 'siren';
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

  // Continuous Loud Alarm Sound
  startAlarm(type = 'siren') {
    this.initContext();
    if (!this.audioCtx) return;
    if (this.isPlayingAlarm) this.stopAlarm();

    this.soundType = type;
    this.isPlayingAlarm = true;

    const now = this.audioCtx.currentTime;

    // Master Gain
    this.alarmGain = this.audioCtx.createGain();
    this.alarmGain.gain.setValueAtTime(0.7, now);
    this.alarmGain.connect(this.audioCtx.destination);

    if (type === 'siren') {
      // Emergency dual-tone siren with frequency modulation
      this.alarmOscillator1 = this.audioCtx.createOscillator();
      this.alarmOscillator1.type = 'sawtooth';
      this.alarmOscillator1.frequency.setValueAtTime(700, now);

      // Low frequency oscillator to modulate pitch
      this.lfoOscillator = this.audioCtx.createOscillator();
      this.lfoOscillator.type = 'sine';
      this.lfoOscillator.frequency.setValueAtTime(2.5, now); // 2.5 sweeps per sec

      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(400, now); // Sweep pitch from 300Hz to 1100Hz

      this.lfoOscillator.connect(lfoGain);
      lfoGain.connect(this.alarmOscillator1.frequency);

      this.alarmOscillator1.connect(this.alarmGain);
      this.alarmOscillator1.start(now);
      this.lfoOscillator.start(now);

    } else if (type === 'buzzer') {
      // Harsh industrial square wave buzzer
      this.alarmOscillator1 = this.audioCtx.createOscillator();
      this.alarmOscillator1.type = 'square';
      this.alarmOscillator1.frequency.setValueAtTime(150, now);

      this.alarmOscillator2 = this.audioCtx.createOscillator();
      this.alarmOscillator2.type = 'sawtooth';
      this.alarmOscillator2.frequency.setValueAtTime(154, now); // Slightly detuned for buzz

      // Pulsing gain modulation
      this.lfoOscillator = this.audioCtx.createOscillator();
      this.lfoOscillator.type = 'square';
      this.lfoOscillator.frequency.setValueAtTime(4, now); // 4 pulses per second

      const pulseGain = this.audioCtx.createGain();
      pulseGain.gain.setValueAtTime(0.5, now);
      this.lfoOscillator.connect(pulseGain.gain);

      this.alarmOscillator1.connect(pulseGain);
      this.alarmOscillator2.connect(pulseGain);
      pulseGain.connect(this.alarmGain);

      this.alarmOscillator1.start(now);
      this.alarmOscillator2.start(now);
      this.lfoOscillator.start(now);

    } else if (type === 'pulse') {
      // High pitch warning pulse
      this.alarmOscillator1 = this.audioCtx.createOscillator();
      this.alarmOscillator1.type = 'sine';
      this.alarmOscillator1.frequency.setValueAtTime(1000, now);

      this.lfoOscillator = this.audioCtx.createOscillator();
      this.lfoOscillator.type = 'square';
      this.lfoOscillator.frequency.setValueAtTime(3, now);

      const lfoGain = this.audioCtx.createGain();
      lfoGain.gain.setValueAtTime(0.8, now);
      this.lfoOscillator.connect(lfoGain);

      this.alarmOscillator1.connect(this.alarmGain);
      this.alarmGain.gain.setValueAtTime(0, now);
      
      // Pulse interval
      this.pulseInterval = setInterval(() => {
        if (!this.isPlayingAlarm || !this.audioCtx) return;
        const t = this.audioCtx.currentTime;
        this.alarmGain.gain.setValueAtTime(0.8, t);
        this.alarmGain.gain.exponentialRampToValueAtTime(0.01, t + 0.2);
      }, 350);

      this.alarmOscillator1.start(now);
      this.lfoOscillator.start(now);
    } else {
      // High pitch classic alarm
      this.alarmOscillator1 = this.audioCtx.createOscillator();
      this.alarmOscillator1.type = 'sine';
      this.alarmOscillator1.frequency.setValueAtTime(880, now);
      this.alarmOscillator1.connect(this.alarmGain);
      this.alarmOscillator1.start(now);
    }
  }

  stopAlarm() {
    this.isPlayingAlarm = false;
    if (this.pulseInterval) {
      clearInterval(this.pulseInterval);
      this.pulseInterval = null;
    }

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
    } catch (e) {
      // Ignore audio stop errors
    }
  }

  // Play pleasant chime when pushup rep is completed
  playRepChime(repNumber = 1) {
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    // Pitch increases with rep number for satisfying progression
    const baseFreq = 523.25; // C5 note
    const pitchMultiplier = 1 + (repNumber * 0.05); 
    const freq = baseFreq * pitchMultiplier;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.15);

    gain.gain.setValueAtTime(0.6, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.4);

    // Speak count
    this.speak(`${repNumber}`);
  }

  // Play Victory Fanfare when target (e.g. 10 reps) is reached
  playVictoryFanfare() {
    this.initContext();
    if (!this.audioCtx) return;

    const now = this.audioCtx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
    
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

    this.speak("Target reached! Alarm turned off!");
  }

  // Voice synthesis text-to-speech helper
  speak(text) {
    if (!this.speechSynth) return;
    try {
      this.speechSynth.cancel(); // cancel any active speech
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.2;
      utterance.pitch = 1.1;
      utterance.volume = 1.0;
      this.speechSynth.speak(utterance);
    } catch (e) {
      console.warn('Speech synthesis unavailable:', e);
    }
  }
}

export const audioEngine = new AudioEngine();
