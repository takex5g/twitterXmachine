import { ButtonState } from './buttonState'

const main = async () => {
  const resultDiv = document.querySelector('#result-div') as HTMLDivElement
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  recognition.lang = 'ja-JP'
  // 暫定の認識結果も取得する
  recognition.interimResults = true
  recognition.continuous = true

  // type W = 'X' | 'XS' | 'REPOST' | 'QUOTE'
  const WORDS = ['X', 'XS', 'REPOST', 'QUOTE'] as const
  type W = (typeof WORDS)[number]
  type RecognitionWordObject = {
    [key in W]: {
      audio: HTMLAudioElement
      lastTime: number
      words: string[]
      excludeWords?: string[]
      className: string
      lastRecognitionText: string
      timerId: NodeJS.Timeout | null
    }
  }

  const recognitionWordObject: RecognitionWordObject = {
    X: {
      audio: new Audio('./src/X.wav'),
      // 最後に反応してから1秒間は反応しないようにするための変数
      lastTime: 0,
      words: ['Twitter', 'ツイッター', 'ついったー', 'ついった', 'ついたー'],
      excludeWords: [],
      className: 'show-x',
      lastRecognitionText: '',
      timerId: null,
    },
    REPOST: {
      audio: new Audio('./src/repost.wav'),
      lastTime: 0,
      words: ['リツイート', 'りついーと', 'りついと'],
      excludeWords: ['引用リツイート', '引用りついーと', '引用りついと'],
      className: 'show-repost',
      lastRecognitionText: '',
      timerId: null,
    },
    XS: {
      audio: new Audio('./src/Xs.wav'),
      lastTime: 0,
      words: ['ツイート', 'ついーと', 'ついと'],
      excludeWords: ['リツイート', 'りついーと', 'りついと', '引用ツイート', '引用ついーと', '引用ついと'],
      className: 'show-xs',
      lastRecognitionText: '',
      timerId: null,
    },
    QUOTE: {
      audio: new Audio('./src/quote.wav'),
      lastTime: 0,
      words: ['引用ツイート', '引用ついーと', '引用ついと', '引用リツイート', '引用りついーと', '引用りついと'],
      excludeWords: [],
      className: 'show-quote',
      lastRecognitionText: '',
      timerId: null,
    },
  }
  //ボタンのstart,stopの切り替えをするクラス
  const buttonState = new ButtonState(document.getElementById('start-btn') as HTMLElement)
  //認識が開始されたら、ボタンのテキストをstopにする
  buttonState.addEvent(
    () => {
      recognition.start()
      // safariで音声認識をするためには、ユーザーの操作が必要なのでここでaudioを読み込む
      for (const w of WORDS) {
        recognitionWordObject[w].audio.load()
      }
    },
    () => recognition.stop(),
  )

  //.x-container
  const xContainer = document.querySelector('.x-container') as HTMLDivElement

  // 確定した(黒の)認識結果
  let finalTranscript = ''

  recognition.onresult = async (event: any) => {
    //confidenceが0.5以下の場合のみ反応する
    if (!event.results[event.results.length - 1].isFinal) {
      let transcriptText = event.results[event.results.length - 1][0].transcript.replace(/\s+/g, '')
      for (const w of WORDS) {
        const { audio, lastTime, words, excludeWords, className, lastRecognitionText, timerId } =
          recognitionWordObject[w]
        if (lastRecognitionText) {
          if (transcriptText.includes(lastRecognitionText)) {
            transcriptText = transcriptText.replace(lastRecognitionText, '')
          }
        }
        // transcriptTextが15文字以上の場合はlastRecognitionText.length文字目以降を使う
        if (transcriptText.length > 15 && lastRecognitionText) {
          //lastRecognitionText.length -10文字目以降を使う
          //lastRecognitionText.length - 10が0以下の場合は0を使う
          const start = lastRecognitionText.length - 6 > 0 ? lastRecognitionText.length - 6 : 0
          transcriptText = transcriptText.slice(start)
        }

        if (Date.now() - lastTime > 3000) {
          //excludeWordsがある場合は、transcriptTextにexcludeWordsが含まれていたら反応しない
          if (
            words.some((word) => transcriptText.includes(word)) &&
            !excludeWords?.some((word) => transcriptText.includes(word))
          ) {
            recognitionWordObject[w].lastTime = Date.now()
            xContainer.classList.add(className)
            //完全一致した場合はlastRecognitionTextを空にする
            if (!words.some((word) => transcriptText === word)) {
              recognitionWordObject[w].lastRecognitionText = transcriptText
            }

            // audioが再生中の場合はaudio.currentTimeを0にする
            if (!audio.paused) {
              audio.currentTime = 0
            }
            audio.play()
            if (timerId) {
              clearTimeout(timerId)
            }
            recognitionWordObject[w].timerId = setTimeout(() => {
              xContainer.classList.remove(className)
            }, 3000)
          }
        }
      }
    }
    if (event.results[event.results.length - 1].isFinal) {
      for (const w of WORDS) {
        recognitionWordObject[w].lastRecognitionText = ''
      }
    }

    let interimTranscript = '' // 暫定(灰色)の認識結果
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const transcript = event.results[i][0].transcript

      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript = transcript
      }

      resultDiv.innerHTML = finalTranscript + '<i style="color:#ddd;">' + interimTranscript + '</i>'
    }
  }
  recognition.error = (event: any) => {
    console.log('エラーが発生しました。', event.error)
    buttonState.changeState('start')
  }
  recognition.onaudiostart = () => {
    buttonState.changeState('stop')
    console.log('録音が開始されました。')
  }
  //録音が終了したら、ボタンのテキストをstartにする
  recognition.onend = () => {
    buttonState.changeState('start')
    console.log('音声認識が終了しました。')
  }
  //.twitterをホバーするとテキストが変わる
  const twitter = document.querySelector('.twitter') as HTMLDivElement
  twitter.addEventListener('mouseover', () => {
    if (!recognitionWordObject.X.audio) recognitionWordObject.X.audio = new Audio('./src/X.wav')
    twitter.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;𝕏&nbsp;&nbsp;&nbsp;&nbsp;'
    if (!recognitionWordObject.X.audio.paused) recognitionWordObject.X.audio.currentTime = 0
    recognitionWordObject.X.audio.play()
  })
  twitter.addEventListener('mouseout', () => {
    twitter.innerHTML = 'Twitter'
  })
}
main()
