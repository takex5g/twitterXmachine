import { ButtonState } from './buttonState'
import {
  createWordConfigs,
  preloadAudios,
  detectAndTrigger,
  resetDetectedPositions,
  type WordConfigs,
} from './wordDetector'

// DOM要素を取得
function getElements() {
  return {
    resultDiv: document.querySelector('#result-div') as HTMLDivElement,
    xContainer: document.querySelector('.x-container') as HTMLDivElement,
    startBtn: document.getElementById('start-btn') as HTMLElement,
    twitter: document.querySelector('.twitter') as HTMLDivElement,
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
) {
  const lastResult = event.results[event.results.length - 1]
  const transcript = lastResult[0].transcript

  // 暫定・確定問わず単語検出を実行
  detectAndTrigger(transcript, configs, xContainer)

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
    console.log('音声認識を自動再開します...', new Date().toLocaleTimeString())
    recognition.start()
  } catch (e) {
    console.error('再起動に失敗:', e)
    // 少し待ってから再試行
    setTimeout(() => {
      if (isListeningRef.value) {
        try {
          recognition.start()
          console.log('再試行で起動成功')
        } catch (e2) {
          console.error('再試行も失敗:', e2)
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
  // 回復可能なエラー
  const recoverableErrors = ['no-speech', 'aborted', 'network', 'audio-capture']

  recognition.onerror = (event: any) => {
    console.log('エラーが発生しました。', event.error, new Date().toLocaleTimeString())

    if (recoverableErrors.includes(event.error)) {
      // onendで自動再開される
      return
    }
    // 回復不可能なエラーは停止
    console.log('回復不可能なエラーのため停止します')
    isListeningRef.value = false
    buttonState.changeState('start')
  }

  recognition.onaudiostart = () => {
    buttonState.changeState('stop')
    console.log('録音が開始されました。', new Date().toLocaleTimeString())
  }

  recognition.onend = () => {
    console.log('onend発火', 'isListening:', isListeningRef.value, new Date().toLocaleTimeString())
    if (isListeningRef.value) {
      safeRestartRecognition(recognition, buttonState, isListeningRef)
    } else {
      buttonState.changeState('start')
      console.log('音声認識が終了しました。')
    }
  }
}

// Twitterホバーイベントの設定
function setupTwitterHover(twitter: HTMLElement, configs: WordConfigs) {
  const xConfig = configs.X

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

// メイン処理
function main() {
  const { resultDiv, xContainer, startBtn, twitter } = getElements()
  const recognition = createSpeechRecognition()
  const configs = createWordConfigs()
  const buttonState = new ButtonState(startBtn)
  const finalTranscriptRef = { value: '' } // 確定した認識結果
  const isListeningRef = { value: false } // 音声認識中フラグ

  // イベント設定
  setupButton(buttonState, recognition, configs, isListeningRef)
  setupRecognitionEvents(recognition, buttonState, isListeningRef)
  setupTwitterHover(twitter, configs)

  // 認識結果の処理
  recognition.onresult = (event: any) => {
    handleRecognitionResult(event, configs, xContainer, resultDiv, finalTranscriptRef)
  }

  // 著作権表示
  const copyright = document.getElementById('copyright')
  if (copyright) {
    copyright.textContent = `©2023-${new Date().getFullYear()} ゆうもや`
  }
}

main()
