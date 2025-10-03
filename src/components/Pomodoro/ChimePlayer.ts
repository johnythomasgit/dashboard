export class ChimePlayer {
  private audioContext: AudioContext | null = null
  private masterGain: GainNode | null = null

  private ensureContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterGain = this.audioContext.createGain()
      this.masterGain.connect(this.audioContext.destination)
      this.masterGain.gain.value = 0.5
    }
  }

  setVolume(volume01: number) {
    this.ensureContext()
    if (this.masterGain) {
      this.masterGain.gain.value = Math.min(1, Math.max(0, volume01))
    }
  }

  async beep(durationMs = 200, frequency = 880) {
    this.ensureContext()
    if (!this.audioContext || !this.masterGain) return
    if (this.audioContext.state === 'suspended') {
      try { await this.audioContext.resume() } catch { /* noop */ }
    }
    const oscillator = this.audioContext.createOscillator()
    const gain = this.audioContext.createGain()
    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    oscillator.connect(gain)
    gain.connect(this.masterGain)

    const now = this.audioContext.currentTime
    gain.gain.setValueAtTime(0, now)
    gain.gain.linearRampToValueAtTime(1, now + 0.005)
    gain.gain.exponentialRampToValueAtTime(0.001, now + durationMs / 1000)

    oscillator.start(now)
    oscillator.stop(now + durationMs / 1000)
  }
}


