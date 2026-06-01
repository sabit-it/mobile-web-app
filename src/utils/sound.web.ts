let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AC = window.AudioContext ?? (window as any).webkitAudioContext;
  if (!AC) return null;
  if (!audioCtx) audioCtx = new AC();
  return audioCtx;
}

export function unlockAudio(): void {
  const ctx = getCtx();
  if (ctx?.state === 'suspended') ctx.resume();
}

export function playNotificationSound(): void {
  const ctx = getCtx();
  if (!ctx) return;
  const play = () => {
    [[880, 0], [1100, 0.12], [880, 0.24]].forEach(([freq, offset]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.35, ctx.currentTime + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + offset + 0.1);
      osc.start(ctx.currentTime + offset);
      osc.stop(ctx.currentTime + offset + 0.12);
    });
  };
  if (ctx.state === 'suspended') {
    ctx.resume().then(play);
  } else {
    play();
  }
}
