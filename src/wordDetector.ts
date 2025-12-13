import { WORD_TYPES, WORD_DEFINITIONS, DISPLAY_DURATION_MS } from './constants'
import type { WordType } from './constants'

export type WordConfig = {
  audio: HTMLAudioElement
  words: string[]
  excludeWords: string[]
  className: string
  timerId: ReturnType<typeof setTimeout> | null
}

export type WordConfigs = Record<WordType, WordConfig>

// 検出済みの単語位置を記録（単語タイプ -> 検出位置）
const detectedPositions = new Map<WordType, number>()

/** 単語設定を初期化する */
export function createWordConfigs(): WordConfigs {
  const configs = {} as WordConfigs
  for (const type of WORD_TYPES) {
    const def = WORD_DEFINITIONS[type]
    configs[type] = {
      audio: new Audio(def.audioPath),
      words: def.words,
      excludeWords: def.excludeWords,
      className: def.className,
      timerId: null,
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

/** 単語の位置を検索（除外ワードを考慮） */
function findWordPosition(transcript: string, config: WordConfig): number {
  // 除外ワードが含まれている場合は-1
  if (config.excludeWords.some((word) => transcript.includes(word))) {
    return -1
  }

  // 最初に見つかった単語の位置を返す
  for (const word of config.words) {
    const pos = transcript.indexOf(word)
    if (pos !== -1) {
      return pos
    }
  }
  return -1
}

/** 検出時のアクションを実行する */
function triggerDetection(config: WordConfig, container: HTMLElement): void {
  container.classList.add(config.className)

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

/**
 * 差分検出方式で単語を検出する
 * 同じ位置の単語には反応せず、新しい位置に出現した場合のみ反応
 */
export function detectAndTrigger(
  transcript: string,
  configs: WordConfigs,
  container: HTMLElement,
): void {
  const normalizedTranscript = transcript.replace(/\s+/g, '')

  for (const type of WORD_TYPES) {
    const config = configs[type]
    const pos = findWordPosition(normalizedTranscript, config)

    if (pos !== -1 && pos !== detectedPositions.get(type)) {
      detectedPositions.set(type, pos)
      triggerDetection(config, container)
    }
  }
}

/** 認識確定時に検出位置をリセットする */
export function resetDetectedPositions(): void {
  detectedPositions.clear()
}
