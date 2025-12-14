import { ButtonState } from './buttonState'
import {
  createWordConfigs,
  preloadAudios,
  detectAndTrigger,
  resetDetectedPositions,
  type WordConfigs,
} from './wordDetector'
import type { WordType } from './constants'

// WordTypeごとのシリアル送信値
const SERIAL_VALUES: Record<WordType, string> = {
  X: '1', // Twitter
  POST: '2', // ツイート
  REPOST: '3', // リツイート
  QUOTE: '4', // 引用ツイート
}
import { SerialManager } from './serialManager'

// DOM要素を取得
function getElements() {
  return {
    resultDiv: document.querySelector('#result-div') as HTMLDivElement,
    xContainer: document.querySelector('.x-container') as HTMLDivElement,
    startBtn: document.getElementById('start-btn') as HTMLElement,
    twitter: document.querySelector('.twitter') as HTMLDivElement,
    serialBtn: document.getElementById('serial-btn') as HTMLButtonElement,
  }
}

// 音声認識を初期化
function createSpeechRecognition() {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  recognition.lang = 'ja-JP'
  recognition.interimResults = true // 暫定の認識結果も取得する
  recognition.continuous = true
  return recognition
}

// 音声認識結果を処理
function handleRecognitionResult(
  event: any,
  configs: WordConfigs,
  xContainer: HTMLElement,
  resultDiv: HTMLElement,
  finalTranscriptRef: { value: string },
  onDetect?: (type: WordType) => void,
) {
  const lastResult = event.results[event.results.length - 1]
  const transcript = lastResult[0].transcript

  // 暫定・確定問わず単語検出を実行
  detectAndTrigger(transcript, configs, xContainer, onDetect)

  // 確定時に検出位置をリセット
  if (lastResult.isFinal) {
    resetDetectedPositions()
  }

  // 表示用テキストの更新
  let interimTranscript = ''
  for (let i = event.resultIndex; i < event.results.length; i++) {
    const text = event.results[i][0].transcript
    if (event.results[i].isFinal) {
      finalTranscriptRef.value += text
    } else {
      interimTranscript = text
    }
  }
  resultDiv.innerHTML =
    finalTranscriptRef.value + '<i style="color:#ddd;">' + interimTranscript + '</i>'
}

// ボタンの設定
function setupButton(
  buttonState: ButtonState,
  recognition: any,
  configs: WordConfigs,
  isListeningRef: { value: boolean },
) {
  buttonState.addEvent(
    () => {
      isListeningRef.value = true
      recognition.start()
      preloadAudios(configs) // Safari対応
    },
    () => {
      isListeningRef.value = false
      recognition.stop()
    },
  )
}

// 音声認識を安全に再起動
function safeRestartRecognition(
  recognition: any,
  buttonState: ButtonState,
  isListeningRef: { value: boolean },
) {
  if (!isListeningRef.value) return

  try {
    recognition.start()
  } catch {
    setTimeout(() => {
      if (isListeningRef.value) {
        try {
          recognition.start()
        } catch {
          isListeningRef.value = false
          buttonState.changeState('start')
        }
      }
    }, 100)
  }
}

// 認識イベントの設定
function setupRecognitionEvents(
  recognition: any,
  buttonState: ButtonState,
  isListeningRef: { value: boolean },
) {
  const recoverableErrors = ['no-speech', 'aborted', 'network', 'audio-capture']

  recognition.onerror = (event: any) => {
    if (recoverableErrors.includes(event.error)) return
    isListeningRef.value = false
    buttonState.changeState('start')
  }

  recognition.onaudiostart = () => {
    buttonState.changeState('stop')
  }

  recognition.onend = () => {
    if (isListeningRef.value) {
      safeRestartRecognition(recognition, buttonState, isListeningRef)
    } else {
      buttonState.changeState('start')
    }
  }
}

// タッチデバイスかどうかを判定
function isTouchDevice(): boolean {
  return 'ontouchstart' in window || navigator.maxTouchPoints > 0
}

// Twitterホバーイベントの設定
function setupTwitterHover(twitter: HTMLElement, configs: WordConfigs) {
  const xConfig = configs.X

  if (isTouchDevice()) {
    // スマートフォン：タップ→再生→遷移
    twitter.addEventListener('click', (e) => {
      e.preventDefault()
      twitter.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;𝕏&nbsp;&nbsp;&nbsp;&nbsp;'

      if (!xConfig.audio.paused) {
        xConfig.audio.currentTime = 0
      }
      xConfig.audio.play()

      // 再生終了後にリンクに遷移
      xConfig.audio.onended = () => {
        const href = twitter.getAttribute('href')
        if (href) {
          window.open(href, '_blank', 'noopener,noreferrer')
        }
        twitter.innerHTML = 'Twitter'
      }
    })
  } else {
    // PC：従来のホバー動作
    twitter.addEventListener('mouseover', () => {
      twitter.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;𝕏&nbsp;&nbsp;&nbsp;&nbsp;'
      if (!xConfig.audio.paused) {
        xConfig.audio.currentTime = 0
      }
      xConfig.audio.play()
    })

    twitter.addEventListener('mouseout', () => {
      twitter.innerHTML = 'Twitter'
    })
  }
}

// シリアルモードのセットアップ
function setupSerialMode(
  serialBtn: HTMLButtonElement,
  serialManager: SerialManager,
  serialModeRef: { value: boolean },
) {
  serialBtn.addEventListener('click', async () => {
    if (serialManager.isConnected) {
      await serialManager.disconnect()
      serialBtn.classList.remove('connected')
      serialModeRef.value = false
    } else {
      const connected = await serialManager.connect()
      if (connected) {
        serialBtn.classList.add('connected')
        serialModeRef.value = true
      }
    }
  })
}

// メイン処理
function main() {
  const { resultDiv, xContainer, startBtn, twitter, serialBtn } = getElements()
  const recognition = createSpeechRecognition()
  const configs = createWordConfigs()
  const buttonState = new ButtonState(startBtn)
  const finalTranscriptRef = { value: '' } // 確定した認識結果
  const isListeningRef = { value: false } // 音声認識中フラグ
  const serialManager = new SerialManager()
  const serialModeRef = { value: false } // シリアルモードフラグ

  // イベント設定
  setupButton(buttonState, recognition, configs, isListeningRef)
  setupRecognitionEvents(recognition, buttonState, isListeningRef)
  setupTwitterHover(twitter, configs)
  setupSerialMode(serialBtn, serialManager, serialModeRef)

  // 認識結果の処理
  recognition.onresult = (event: any) => {
    const onDetect = serialModeRef.value
      ? (type: WordType) => {
          serialManager.send(SERIAL_VALUES[type])
        }
      : undefined
    handleRecognitionResult(event, configs, xContainer, resultDiv, finalTranscriptRef, onDetect)
  }

  // 著作権表示
  const copyright = document.getElementById('copyright')
  if (copyright) {
    copyright.textContent = `©2023-${new Date().getFullYear()} ゆうもや`
  }
}

main()
