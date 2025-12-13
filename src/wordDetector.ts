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

/**
 * 出現回数ベースの重複検出防止
 *
 * 【課題】
 * Web Speech APIの暫定結果(interimResults)はリアルタイムに更新されるため、
 * 同じ単語に対して何度も反応してしまう問題がある。
 * 例: "ツイッター" → "ツイッターを" → "ツイッターを見た" と更新される度に反応
 *
 * 【解決策】
 * 単語の「出現回数」を記録し、回数が増えた場合のみ反応する。
 * - "ツイッターを見た" (count=1) → 初回なので反応、1を記録
 * - "ツイッターを見た" (count=1) → 記録と同じなのでスキップ
 * - "ツイッターでツイッターを" (count=2) → 増えたので反応、2を記録
 *
 * これにより位置ズレの問題も解決:
 * - "ツイッターを" (count=1) → 反応、1を記録
 * - "えーツイッターを" (count=1) → 位置は変わったが回数は同じなのでスキップ
 */
const detectedCounts = new Map<WordType, number>()

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

/** テキスト内の単語出現回数をカウント */
function countWordOccurrences(transcript: string, config: WordConfig): number {
  // 除外ワードが含まれている場合は0
  if (config.excludeWords.some((word) => transcript.includes(word))) {
    return 0
  }

  // 各単語の出現回数を合計
  let count = 0
  for (const word of config.words) {
    let pos = 0
    while ((pos = transcript.indexOf(word, pos)) !== -1) {
      count++
      pos += word.length
    }
  }
  return count
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
 * 単語を検出する
 * 出現回数が増えた場合のみ反応（同じ単語の重複検出を防ぐ）
 */
export function detectAndTrigger(
  transcript: string,
  configs: WordConfigs,
  container: HTMLElement,
): void {
  const normalizedTranscript = transcript.replace(/\s+/g, '')

  for (const type of WORD_TYPES) {
    const config = configs[type]
    const currentCount = countWordOccurrences(normalizedTranscript, config)
    const prevCount = detectedCounts.get(type) ?? 0

    // 出現回数が増えた分だけ反応
    if (currentCount > prevCount) {
      detectedCounts.set(type, currentCount)
      triggerDetection(config, container)
    }
  }
}

/** 認識確定時に検出カウントをリセットする */
export function resetDetectedPositions(): void {
  detectedCounts.clear()
}
