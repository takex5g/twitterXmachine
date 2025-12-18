// Web Audio APIを使った音声再生（iOS Safari対策）

let audioContext: AudioContext | null = null
const audioBuffers = new Map<string, AudioBuffer>()

/** AudioContextを取得（遅延初期化） */
export function getAudioContext(): AudioContext {
  if (!audioContext) {
    audioContext = new AudioContext()
  }
  return audioContext
}

/** AudioContextを再開（ユーザーインタラクション後に呼ぶ） */
export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext()
  if (ctx.state === 'suspended') {
    await ctx.resume()
  }
}

/** 音声ファイルをプリロード */
export async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  // キャッシュがあれば返す
  const cached = audioBuffers.get(url)
  if (cached) return cached

  const ctx = getAudioContext()
  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const audioBuffer = await ctx.decodeAudioData(arrayBuffer)

  audioBuffers.set(url, audioBuffer)
  return audioBuffer
}

/** Web Audio APIで音声を再生 */
export function playAudioBuffer(buffer: AudioBuffer): void {
  const ctx = getAudioContext()
  const source = ctx.createBufferSource()
  source.buffer = buffer
  source.connect(ctx.destination)
  source.start(0)
}

/** URLから音声を再生 */
export async function playAudioFromUrl(url: string): Promise<void> {
  const buffer = await loadAudioBuffer(url)
  playAudioBuffer(buffer)
}
