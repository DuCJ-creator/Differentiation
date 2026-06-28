// Web Audio API Synthesizer & Sound Effects Engine
// Fully self-contained, no external MP3 dependencies, high reliability

let audioCtx: AudioContext | null = null;
let ambientInterval: any = null;
let ambientOscillators: { osc: OscillatorNode; gain: GainNode }[] = [];

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === "suspended") {
    audioCtx.resume();
  }
  return audioCtx;
}

export function playTapSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.type = "sine";
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.1);
    
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.12);
  } catch (e) {
    console.warn("Audio Context block or error:", e);
  }
}

export function playSuccessSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Play an upward arpeggio (C5 -> E5 -> G5)
    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "triangle";
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);
      
      gain.gain.setValueAtTime(0.06, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.2);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.22);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playErrorSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Low double buzz
    const freqs = [180, 160];
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(freq, now + idx * 0.1);
      
      gain.gain.setValueAtTime(0.05, now + idx * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.1 + 0.15);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.1);
      osc.stop(now + idx * 0.1 + 0.18);
    });
  } catch (e) {
    console.warn(e);
  }
}

export function playLevelUpSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    // Fanfare chord: C4 (261.63), G4 (392.00), C5 (523.25), E5 (659.25)
    const notes = [261.63, 392.00, 523.25, 659.25];
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.5, now + 0.4);
      
      gain.gain.setValueAtTime(0, now + idx * 0.05);
      gain.gain.linearRampToValueAtTime(0.04, now + idx * 0.05 + 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.05);
      osc.stop(now + 0.85);
    });
  } catch (e) {
    console.warn(e);
  }
}

// Generative lo-fi chords in background
// Chord progressions (Amin9 -> Fma7 -> Cma9 -> G6) played on soft triangle/sine waves
export function startAmbientFocusMusic() {
  try {
    const ctx = getAudioContext();
    if (ambientInterval) return; // already active
    
    let step = 0;
    const progression = [
      // Amin9 (A3, C4, E4, B4)
      [220.00, 261.63, 329.63, 493.88],
      // Fmaj7 (F3, A3, C4, E4)
      [174.61, 220.00, 261.63, 329.63],
      // Cmaj9 (C3, E3, G3, D4)
      [130.81, 164.81, 196.00, 293.66],
      // G6 (G3, B3, D4, E4)
      [196.00, 246.94, 293.66, 329.63]
    ];

    const playChord = () => {
      const now = ctx.currentTime;
      const chord = progression[step % progression.length];
      
      // Stop old chords if still active
      clearOldOscillators();

      // Start new notes softly
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, now);
        
        // Soft volume pad
        gain.gain.setValueAtTime(0, now);
        gain.gain.linearRampToValueAtTime(0.015, now + 1.5); // very gentle fade-in
        gain.gain.setValueAtTime(0.015, now + 3.0);
        gain.gain.linearRampToValueAtTime(0.001, now + 4.5); // long fade-out
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start(now);
        osc.stop(now + 4.8);
        
        ambientOscillators.push({ osc, gain });
      });
      
      step++;
    };

    // Play first chord instantly
    playChord();
    
    // Interval of 5.0 seconds
    ambientInterval = setInterval(playChord, 5000);
  } catch (e) {
    console.warn("Ambient activation error:", e);
  }
}

function clearOldOscillators() {
  ambientOscillators.forEach((item) => {
    try {
      item.osc.disconnect();
    } catch (e) {}
  });
  ambientOscillators = [];
}

export function stopAmbientFocusMusic() {
  if (ambientInterval) {
    clearInterval(ambientInterval);
    ambientInterval = null;
  }
  clearOldOscillators();
}

// Trigger speech synthesis to pronounce a word/phrase
export function speakWord(text: string, rate: number = 0.85) {
  if (!("speechSynthesis" in window)) {
    console.warn("Speech synthesis unavailable.");
    return;
  }
  // Cancel previous talk immediately to avoid overlap queue delays
  window.speechSynthesis.cancel();
  
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "en-US";
  utterance.rate = rate;
  window.speechSynthesis.speak(utterance);
}
