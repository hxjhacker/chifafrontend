"use client";

import { useEffect, useState } from "react";
import { Volume2, VolumeX } from "lucide-react";

const MUTE_STORAGE_KEY = "chifaglow_dashboard_sounds_muted";
const SOUND_EVENT = "chifaglow-dashboard-sound";
const MUTE_EVENT = "chifaglow-dashboard-sound-mute";

export type DashboardSoundKind = "keypress" | "success" | "error";

type SoundEventDetail = {
  kind?: DashboardSoundKind;
};

function isTouchDevice() {
  return (
    navigator.maxTouchPoints > 0 ||
    "ontouchstart" in window ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

function isDesktopPc() {
  return window.innerWidth >= 1024 && !isTouchDevice();
}

function readMuted() {
  try {
    return window.localStorage.getItem(MUTE_STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

export function dispatchDashboardSound(kind: DashboardSoundKind) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<SoundEventDetail>(SOUND_EVENT, { detail: { kind } }));
}

export function DashboardSoundEngine() {
  useEffect(() => {
    let muted = readMuted();
    let audioContext: AudioContext | null = null;

    function getAudioContext() {
      if (!audioContext) {
        const AudioContextConstructor =
          window.AudioContext ||
          (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioContextConstructor) return null;
        audioContext = new AudioContextConstructor();
      }
      if (audioContext.state === "suspended") void audioContext.resume();
      return audioContext;
    }

    function playKeypress() {
      const context = getAudioContext();
      if (!context) return;
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "triangle";
      oscillator.frequency.setValueAtTime(850, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.045, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.04);
    }

    function playSuccess() {
      const context = getAudioContext();
      if (!context) return;
      const now = context.currentTime;
      const first = context.createOscillator();
      const second = context.createOscillator();
      const firstGain = context.createGain();
      const secondGain = context.createGain();

      first.type = "sine";
      second.type = "triangle";
      first.frequency.setValueAtTime(540, now);
      first.frequency.exponentialRampToValueAtTime(1080, now + 0.18);
      second.frequency.setValueAtTime(540, now + 0.06);
      second.frequency.exponentialRampToValueAtTime(1080, now + 0.22);
      firstGain.gain.setValueAtTime(0.0001, now);
      firstGain.gain.exponentialRampToValueAtTime(0.055, now + 0.012);
      firstGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      secondGain.gain.setValueAtTime(0.0001, now + 0.06);
      secondGain.gain.exponentialRampToValueAtTime(0.035, now + 0.075);
      secondGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);

      first.connect(firstGain);
      second.connect(secondGain);
      firstGain.connect(context.destination);
      secondGain.connect(context.destination);
      first.start(now);
      second.start(now + 0.06);
      first.stop(now + 0.25);
      second.stop(now + 0.29);
    }

    function playError() {
      const context = getAudioContext();
      if (!context) return;
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = "sawtooth";
      oscillator.frequency.setValueAtTime(140, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.004);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      oscillator.connect(gain);
      gain.connect(context.destination);
      oscillator.start(now);
      oscillator.stop(now + 0.085);
    }

    function play(kind: DashboardSoundKind) {
      if (muted || !isDesktopPc()) return;
      if (kind === "keypress") playKeypress();
      else if (kind === "success") playSuccess();
      else playError();
    }

    function onSound(event: Event) {
      const kind = (event as CustomEvent<SoundEventDetail>).detail?.kind;
      if (kind) play(kind);
    }

    function onMute(event: Event) {
      muted = Boolean((event as CustomEvent<{ muted?: boolean }>).detail?.muted);
    }

    function onClick(event: MouseEvent) {
      if (muted || !isDesktopPc()) return;
      const target = event.target;
      if (!(target instanceof Element) || target.closest("[data-dashboard-sound-toggle]")) return;
      if (target.closest("button, a, input, select, textarea, [role='button']")) playKeypress();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener(SOUND_EVENT, onSound);
    window.addEventListener(MUTE_EVENT, onMute);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(SOUND_EVENT, onSound);
      window.removeEventListener(MUTE_EVENT, onMute);
      void audioContext?.close();
    };
  }, []);

  return null;
}

export function DashboardSoundToggle({ className = "" }: { className?: string }) {
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    setMuted(readMuted());
  }, []);

  function toggle() {
    const next = !muted;
    setMuted(next);
    try {
      window.localStorage.setItem(MUTE_STORAGE_KEY, String(next));
    } catch {
      /* Storage can be unavailable in private browsing. */
    }
    window.dispatchEvent(new CustomEvent(MUTE_EVENT, { detail: { muted: next } }));
  }

  return (
    <button
      type="button"
      data-dashboard-sound-toggle
      aria-label={muted ? "تشغيل أصوات لوحة التحكم" : "كتم أصوات لوحة التحكم"}
      aria-pressed={muted}
      title={muted ? "تشغيل أصوات لوحة التحكم" : "كتم أصوات لوحة التحكم"}
      onClick={toggle}
      className={className}
    >
      {muted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
    </button>
  );
}
