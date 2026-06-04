/**
 * Admin «Ԇակազ» alert — plays only when {@link playAdminOrderAlert} is called (new order).
 * {@link primeAdminOrderAlertAudio} unlocks the audio context silently (no sound).
 */

const ALERT_NOTE_HZ = [523.25, 659.25, 783.99] as const;
const ALERT_NOTE_DURATION_S = 0.18;
const ALERT_NOTE_GAP_S = 0.07;
const ALERT_SEQUENCE_REPEAT = 2;
const ALERT_SEQUENCE_PAUSE_S = 0.14;

let sharedAudioContext: AudioContext | null = null;
let audioUnlocked = false;

function getSharedAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') {
    return null;
  }
  const AudioCtx =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) {
    return null;
  }
  if (!sharedAudioContext) {
    sharedAudioContext = new AudioCtx();
  }
  return sharedAudioContext;
}

async function resumeAudioContext(ctx: AudioContext): Promise<boolean> {
  try {
    if (ctx.state !== 'running') {
      await ctx.resume();
    }
    const contextState: AudioContextState = ctx.state;
    return contextState === 'running';
  } catch {
    return false;
  }
}

function playTone(ctx: AudioContext, frequencyHz: number, startAt: number, durationS: number): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequencyHz;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  gain.gain.setValueAtTime(0.0001, startAt);
  gain.gain.exponentialRampToValueAtTime(0.35, startAt + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + durationS);
  oscillator.start(startAt);
  oscillator.stop(startAt + durationS + 0.02);
}

function playAlertMelody(ctx: AudioContext): void {
  let cursor = ctx.currentTime + 0.05;
  for (let repeat = 0; repeat < ALERT_SEQUENCE_REPEAT; repeat += 1) {
    for (const frequencyHz of ALERT_NOTE_HZ) {
      playTone(ctx, frequencyHz, cursor, ALERT_NOTE_DURATION_S);
      cursor += ALERT_NOTE_DURATION_S + ALERT_NOTE_GAP_S;
    }
    cursor += ALERT_SEQUENCE_PAUSE_S;
  }
}

function speakZakaz(): void {
  if (typeof window === 'undefined' || !window.speechSynthesis) {
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance('Զակազ');
  utterance.lang = 'hy-AM';
  utterance.rate = 0.92;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const armenianVoice = voices.find((voice) => voice.lang.toLowerCase().startsWith('hy'));
  if (armenianVoice) {
    utterance.voice = armenianVoice;
  }
  window.speechSynthesis.speak(utterance);
}

/**
 * Silently unlocks Web Audio after a user gesture — does not play the order alert.
 */
export async function primeAdminOrderAlertAudio(): Promise<void> {
  if (audioUnlocked) {
    return;
  }
  const ctx = getSharedAudioContext();
  if (!ctx) {
    return;
  }
  try {
    window.speechSynthesis?.getVoices();
  } catch {
    // ignore
  }
  const running = await resumeAudioContext(ctx);
  if (running) {
    audioUnlocked = true;
  }
}

/** Plays audible alert — call only when a new order is detected. */
export async function playAdminOrderAlert(): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }
  const ctx = getSharedAudioContext();
  if (!ctx) {
    speakZakaz();
    return;
  }

  const running = await resumeAudioContext(ctx);
  if (running || audioUnlocked) {
    playAlertMelody(ctx);
    window.setTimeout(speakZakaz, 720);
    return;
  }

  speakZakaz();
}
