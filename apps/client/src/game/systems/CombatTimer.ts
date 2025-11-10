export class CombatTimer {
  private maxTime: number; // in milliseconds
  private elapsedTime: number = 0;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private onTimeUpCallback?: () => void;

  constructor(maxTimeInSeconds: number = 180) {
    this.maxTime = maxTimeInSeconds * 1000; // Convert to milliseconds
  }

  start(): void {
    this.isRunning = true;
    this.isPaused = false;
    this.elapsedTime = 0;
  }

  pause(): void {
    this.isPaused = true;
  }

  resume(): void {
    this.isPaused = false;
  }

  stop(): void {
    this.isRunning = false;
    this.isPaused = false;
  }

  update(delta: number): void {
    if (!this.isRunning || this.isPaused) {
      return;
    }

    this.elapsedTime += delta;

    if (this.elapsedTime >= this.maxTime) {
      this.elapsedTime = this.maxTime;
      this.isRunning = false;

      if (this.onTimeUpCallback) {
        this.onTimeUpCallback();
      }
    }
  }

  getRemainingTime(): number {
    return Math.max(0, this.maxTime - this.elapsedTime);
  }

  getRemainingTimeInSeconds(): number {
    return Math.floor(this.getRemainingTime() / 1000);
  }

  getElapsedTime(): number {
    return this.elapsedTime;
  }

  getElapsedTimeInSeconds(): number {
    return Math.floor(this.elapsedTime / 1000);
  }

  getProgress(): number {
    return (this.elapsedTime / this.maxTime) * 100;
  }

  isTimeUp(): boolean {
    return this.elapsedTime >= this.maxTime;
  }

  isTimerRunning(): boolean {
    return this.isRunning && !this.isPaused;
  }

  setOnTimeUpCallback(callback: () => void): void {
    this.onTimeUpCallback = callback;
  }

  /**
   * Get remaining time formatted as MM:SS
   */
  getFormattedRemainingTime(): string {
    const remainingSeconds = this.getRemainingTimeInSeconds();
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Get elapsed time formatted as MM:SS
   */
  getFormattedElapsedTime(): string {
    const elapsedSeconds = this.getElapsedTimeInSeconds();
    const minutes = Math.floor(elapsedSeconds / 60);
    const seconds = elapsedSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  /**
   * Check if timer is in critical zone (less than 30 seconds remaining)
   */
  isCritical(): boolean {
    return this.getRemainingTimeInSeconds() <= 30;
  }

  /**
   * Check if timer is in warning zone (less than 60 seconds remaining)
   */
  isWarning(): boolean {
    return this.getRemainingTimeInSeconds() <= 60;
  }

  reset(): void {
    this.elapsedTime = 0;
    this.isRunning = false;
    this.isPaused = false;
  }
}
