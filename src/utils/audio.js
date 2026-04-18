/**
 * Audio Manager - placeholder hooks for sound integration.
 * Replace the empty play() calls with actual audio playback
 * once sound assets are available.
 *
 * Usage:
 *   import { Audio } from '../utils/audio'
 *   Audio.play('fire')
 */

const sounds = {
  fire: null,
  hit: null,
  explosion: null,
  engine: null,
  engineIdle: null,
  reload: null,
  uiClick: null,
  victory: null,
  defeat: null,
}

let audioContext = null

function getContext() {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)()
  }
  return audioContext
}

export const Audio = {
  /**
   * Load a sound file. Call during initialization.
   * @param {string} name - Sound key from the sounds map
   * @param {string} url - Path to the audio file
   */
  async load(name, url) {
    try {
      const ctx = getContext()
      const response = await fetch(url)
      const arrayBuffer = await response.arrayBuffer()
      sounds[name] = await ctx.decodeAudioData(arrayBuffer)
    } catch {
      // Audio file not available - this is expected during development
    }
  },

  /**
   * Play a loaded sound.
   * @param {string} name - Sound key
   * @param {object} options - { volume: 0-1, loop: boolean }
   */
  play(name, options = {}) {
    const buffer = sounds[name]
    if (!buffer) return null

    const ctx = getContext()
    const source = ctx.createBufferSource()
    const gain = ctx.createGain()

    source.buffer = buffer
    source.loop = options.loop || false
    gain.gain.value = options.volume ?? 1.0

    source.connect(gain)
    gain.connect(ctx.destination)
    source.start(0)

    return { source, gain }
  },

  /** Stop a playing sound instance */
  stop(instance) {
    if (instance?.source) {
      try { instance.source.stop() } catch { /* already stopped */ }
    }
  },

  /** Resume audio context (must be called from user gesture) */
  resume() {
    getContext().resume()
  },
}
