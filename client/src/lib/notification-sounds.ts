
// Notification sound utilities
export type NotificationSound = 
  | 'trade_started' 
  | 'trade_completed' 
  | 'message_received' 
  | 'time_warning' 
  | 'trade_cancelled'
  | 'payment_marked'
  | 'escrow_released';

// Create audio context for playing notification sounds
class NotificationSounds {
  private audioContext: AudioContext | null = null;
  private enabled: boolean = true;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.warn('AudioContext not supported', e);
      }
    }
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    localStorage.setItem('notification_sounds_enabled', enabled ? 'true' : 'false');
  }

  isEnabled(): boolean {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('notification_sounds_enabled');
    return stored !== 'false'; // enabled by default
  }

  // Play a simple beep sound using Web Audio API
  private playBeep(frequency: number, duration: number, volume: number = 0.3) {
    if (!this.enabled || !this.isEnabled() || !this.audioContext) return;

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.frequency.value = frequency;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

      oscillator.start(this.audioContext.currentTime);
      oscillator.stop(this.audioContext.currentTime + duration);
    } catch (e) {
      console.warn('Error playing notification sound:', e);
    }
  }

  play(sound: NotificationSound) {
    if (!this.isEnabled()) return;

    switch (sound) {
      case 'trade_started':
        // Pleasant ascending tone
        this.playBeep(523.25, 0.1); // C5
        setTimeout(() => this.playBeep(659.25, 0.15), 100); // E5
        break;

      case 'trade_completed':
        // Success jingle
        this.playBeep(523.25, 0.1); // C5
        setTimeout(() => this.playBeep(659.25, 0.1), 100); // E5
        setTimeout(() => this.playBeep(783.99, 0.2), 200); // G5
        break;

      case 'message_received':
        // Short pop
        this.playBeep(800, 0.08, 0.2);
        break;

      case 'time_warning':
        // Alert beeps
        this.playBeep(880, 0.15);
        setTimeout(() => this.playBeep(880, 0.15), 200);
        break;

      case 'trade_cancelled':
        // Descending tone
        this.playBeep(659.25, 0.1); // E5
        setTimeout(() => this.playBeep(523.25, 0.2), 100); // C5
        break;

      case 'payment_marked':
        // Hopeful double beep
        this.playBeep(698.46, 0.12); // F5
        setTimeout(() => this.playBeep(880, 0.15), 120); // A5
        break;

      case 'escrow_released':
        // Triumphant ascending sequence
        this.playBeep(523.25, 0.1); // C5
        setTimeout(() => this.playBeep(659.25, 0.1), 100); // E5
        setTimeout(() => this.playBeep(783.99, 0.1), 200); // G5
        setTimeout(() => this.playBeep(1046.5, 0.2), 300); // C6
        break;

      default:
        // Default notification sound
        this.playBeep(800, 0.1);
    }
  }
}

export const notificationSounds = new NotificationSounds();
