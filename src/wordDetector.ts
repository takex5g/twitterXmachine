import {
  WORD_TYPES,
  WORD_DEFINITIONS,
  COOLDOWN_MS,
  DISPLAY_DURATION_MS,
  MAX_TRANSCRIPT_LENGTH,
  TRANSCRIPT_SLICE_OFFSET,
} from './constants'
import type { WordType } from './constants'

export type WordState = {
  audio: HTMLAudioElement
  lastTime: number
  lastRecognitionText: string
  timerId: ReturnType<typeof setTimeout> | null
}

export type WordConfig = WordState & {
  words: string[]
  excludeWords: string[]
  className: string
}

export type WordConfigs = Record<WordType, WordConfig>

/** 単語設定を初期化する */
export function createWordConfigs(): WordConfigs {
  const configs = {} as WordConfigs
  for (const type of WORD_TYPES) {
    const def = WORD_DEFINITIONS[type]
    configs[type] = {
      audio: new Audio(def.audioPath),
      lastTime: 0,
      lastRecognitionText: '',
      timerId: null,
      words: def.words,
      excludeWords: def.excludeWords,
      className: def.className,
    }
  }
  return configs
}

/** 全てのオーディオをプリロードする（Safari対応） */
export function preloadAudios(configs: WordConfigs): void {
  for (const type of WORD_TYPES) {
    configs[type].audio.load()
  }
}

/** テキストを前処理する（前回の認識結果を除去、長すぎる場合は末尾を使用） */
export function processTranscript(transcript: string, lastText: string): string {
  let processed = transcript.replace(/\s+/g, '')

  if (lastText && processed.includes(lastText)) {
    processed = processed.replace(lastText, '')
  }

  if (processed.length > MAX_TRANSCRIPT_LENGTH && lastText) {
    const start = Math.max(0, lastText.length - TRANSCRIPT_SLICE_OFFSET)
    processed = processed.slice(start)
  }

  return processed
}

/** 単語が検出されたかチェックする */
export function detectWord(transcript: string, config: WordConfig): boolean {
  const hasWord = config.words.some((word) => transcript.includes(word))
  const hasExclude = config.excludeWords.some((word) => transcript.includes(word))
  return hasWord && !hasExclude
}

/** 単語が完全一致かどうかチェックする */
export function isExactMatch(transcript: string, config: WordConfig): boolean {
  return config.words.some((word) => transcript === word)
}

/** クールダウン中かどうかチェックする */
export function isInCooldown(config: WordConfig): boolean {
  return Date.now() - config.lastTime <= COOLDOWN_MS
}

/** 検出時のアクションを実行する */
export function triggerDetection(config: WordConfig, transcript: string, container: HTMLElement): void {
  config.lastTime = Date.now()
  container.classList.add(config.className)

  if (!isExactMatch(transcript, config)) {
    config.lastRecognitionText = transcript
  }

  // オーディオ再生
  if (!config.audio.paused) {
    config.audio.currentTime = 0
  }
  config.audio.play()

  // 前のタイマーをクリア
  if (config.timerId) {
    clearTimeout(config.timerId)
  }

  // 表示を一定時間後に消す
  config.timerId = setTimeout(() => {
    container.classList.remove(config.className)
  }, DISPLAY_DURATION_MS)
}

/** 認識確定時に状態をリセットする */
export function resetRecognitionTexts(configs: WordConfigs): void {
  for (const type of WORD_TYPES) {
    configs[type].lastRecognitionText = ''
  }
}
