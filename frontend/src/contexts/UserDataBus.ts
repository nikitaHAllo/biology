// Simple global event bus for user data refresh notifications
// Allows different parts of the app (e.g., Home and Profile) to stay in sync

class UserDataBus {
  private target = new EventTarget();

  on(event: string, listener: (e: Event) => void): void {
    this.target.addEventListener(event, listener as EventListener);
  }

  off(event: string, listener: (e: Event) => void): void {
    this.target.removeEventListener(event, listener as EventListener);
  }

  emit(event: string, detail?: unknown): void {
    const ev = new CustomEvent(event, { detail });
    this.target.dispatchEvent(ev);
  }
}

export const userDataBus = new UserDataBus();

export const USER_EVENTS = {
  REFRESH_REQUESTED: 'user:refresh',
} as const;
