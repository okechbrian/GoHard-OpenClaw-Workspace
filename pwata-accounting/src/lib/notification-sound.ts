let audioCtx: AudioContext | null = null;

function getCtx() {
  if (!audioCtx) {
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

export function unlockAudio() {
  try {
    const ctx = getCtx();
    if (ctx.state === "suspended") ctx.resume();
  } catch {

  }
}

export function playNotificationChime() {
  try {
    const ctx = getCtx();
    if (ctx.state !== "running") return;

    const now = ctx.currentTime;

    const gain = ctx.createGain();
    gain.connect(ctx.destination);
    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    const osc1 = ctx.createOscillator();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(880, now);
    osc1.connect(gain);
    osc1.start(now);
    osc1.stop(now + 0.15);

    const osc2 = ctx.createOscillator();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(1320, now + 0.15);
    osc2.connect(gain);
    osc2.start(now + 0.15);
    osc2.stop(now + 0.4);
  } catch {

  }
}
