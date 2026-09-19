/** Holds exactly one OS inhibitor, without changing the user's power settings. */
export class DisplaySleepProtection {
  private id: number | undefined;
  private unavailable = false;
  constructor(private readonly blocker: {start(type: 'prevent-display-sleep'): number; stop(id: number): void; isStarted(id: number): boolean}) {}
  setEnabled(enabled: boolean) {
    if (enabled) {
      if (this.id === undefined || !this.blocker.isStarted(this.id)) {
        try { this.id = this.blocker.start('prevent-display-sleep'); this.unavailable = false; }
        catch { this.id = undefined; this.unavailable = true; }
      }
    } else if (this.id !== undefined) {
      if (this.blocker.isStarted(this.id)) this.blocker.stop(this.id);
      this.id = undefined;
    }
  }
  getStatus(): 'active'|'disabled'|'unavailable' {
    if (this.unavailable) return 'unavailable';
    return this.id !== undefined && this.blocker.isStarted(this.id) ? 'active' : 'disabled';
  }
}
