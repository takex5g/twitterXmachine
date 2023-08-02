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

  type W = 'X' | 'XS'
  type RecognitionWordObject = {
    [key in W]: {
      audio: HTMLAudioElement
      lastTime: number
      words: string[]
      className: string
      lastRecognitionText: string
      timerId: NodeJS.Timeout | null
    }
  }

  const recognitionWordObject: RecognitionWordObject = {
    X: {
      audio: new Audio('/src/X.wav'),
      // 最後に反応してから1秒間は反応しないようにするための変数
      lastTime: 0,
      words: ['Twitter', 'ツイッター', 'ついったー', 'ついった', 'ついたー'],
      className: 'show-x',
      lastRecognitionText: '',
      timerId: null,
    },
    XS: {
      audio: new Audio('/src/Xs.wav'),
      lastTime: 0,
      words: ['ツイート', 'ついーと', 'ついと'],
      className: 'show-xs',
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
      // X.wavを読み込む
      recognitionWordObject.X.audio = new Audio('/src/X.wav')
      recognitionWordObject.XS.audio = new Audio('/src/Xs.wav')
    },
    () => recognition.stop(),
  )

  //.x-container
  const xContainer = document.querySelector('.x-container') as HTMLDivElement

  // 確定した(黒の)認識結果
  let finalTranscript = ''

  recognition.onresult = async (event: any) => {
    const W = ['X', 'XS'] as const
    console.log(
      'transcriptText',
      event.results[event.results.length - 1][0],
      event.results[event.results.length - 1].isFinal,
    )
    //confidenceが0.5以下の場合のみ反応する
    if (
      !event.results[event.results.length - 1].isFinal &&
      event.results[event.results.length - 1][0].confidence < 0.5
    ) {
      let transcriptText = event.results[event.results.length - 1][0].transcript.replace(/\s+/g, '')
      for (const w of W) {
        const { audio, lastTime, words, className, lastRecognitionText, timerId } = recognitionWordObject[w]
        // if (Date.now() - lastTime > 8000) {
        //   // 先頭がwordsのどれかに一致していたらlastRecognitionTextを空にする
        //   if (words.some((word) => lastRecognitionText.indexOf(word) === 0)) {
        //     console.log('8秒経過', lastRecognitionText)
        //     recognitionWordObject[w].lastRecognitionText = ''
        //   }
        // }
        if (lastRecognitionText) {
          if (transcriptText.includes(lastRecognitionText)) {
            console.log('lastRecognitionText', lastRecognitionText)
            transcriptText = transcriptText.replace(lastRecognitionText, '')
          }
        }
        // transcriptTextが15文字以上の場合はlastRecognitionText.length文字目以降を使う
        if (transcriptText.length > 15) {
          transcriptText = transcriptText.slice(lastRecognitionText.length)
        }

        if (Date.now() - lastTime > 3000) {
          if (words.some((word) => transcriptText.includes(word))) {
            console.log(lastRecognitionText, transcriptText)

            recognitionWordObject[w].lastTime = Date.now()
            xContainer.classList.add(className)

            recognitionWordObject[w].lastRecognitionText = transcriptText
            console.log('lastRecognitionText', recognitionWordObject[w].lastRecognitionText)

            // audio.play()
            // audioが再生中の場合はaudio.currentTimeを0にする
            if (!audio.paused) {
              audio.currentTime = 0
            }
            audio.play()
            console.log('X!!!!')
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
}
main()

const twAudio = new Audio('/src/X.wav')
//.twitterをホバーするとテキストが変わる
const twitter = document.querySelector('.twitter') as HTMLDivElement
twitter.addEventListener('mouseover', () => {
  twitter.innerHTML = '&nbsp;&nbsp;&nbsp;&nbsp;𝕏&nbsp;&nbsp;&nbsp;&nbsp;'
  twAudio.play()
})
twitter.addEventListener('mouseout', () => {
  twitter.innerHTML = 'Twitter'
})
