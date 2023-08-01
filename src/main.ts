import { ButtonState } from './buttonState'

const main = async () => {
  const resultDiv = document.querySelector('#result-div') as HTMLDivElement
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const SpeechRecognition = window.SpeechRecognition || webkitSpeechRecognition
  const recognition = new SpeechRecognition()
  recognition.lang = 'ja-JP'
  recognition.interimResults = true
  recognition.continuous = true
  let audio = new Audio()
  let audio2 = new Audio()
  //ボタンのstart,stopの切り替えをするクラス
  const buttonState = new ButtonState(document.getElementById('start-btn') as HTMLElement)
  //認識が開始されたら、ボタンのテキストをstopにする
  buttonState.addEvent(
    () => {
      recognition.start()
      // X.wavを読み込む
      audio = new Audio('/src/X.wav')
      audio2 = new Audio('/src/Xs.wav')
    },
    () => recognition.stop(),
  )

  //反応する文字列
  const twitterWords = ['Twitter', 'ツイッター', 'ついったー', 'ついった', 'ついたー']
  const tweetWords = ['ツイート', 'ついーと', 'ついと']

  //.x-container
  const xContainer = document.querySelector('.x-container') as HTMLDivElement

  // 確定した(黒の)認識結果
  let finalTranscript = ''
  // 最後に反応してから1秒間は反応しないようにするための変数
  let XlastTime = 0
  let XSlastTime = 0
  recognition.onresult = async (event: any) => {
    let interimTranscript = '' // 暫定(灰色)の認識結果
    for (let i = event.resultIndex; i < event.results.length; i++) {
      console.log(event.results[i][0].transcript)
      const transcript = event.results[i][0].transcript

      if (Date.now() - XlastTime > 1000) {
        if (twitterWords.some((word) => transcript.includes(word))) {
          console.log('X')
          audio.play()
          XlastTime = Date.now()
          recognition.stop()

          setTimeout(() => {
            recognition.start()
          }, 300)
          setTimeout(() => {
            recognition.start()
          }, 500)
        }
      }
      if (Date.now() - XSlastTime > 1000) {
        if (tweetWords.some((word) => transcript.includes(word))) {
          console.log('エクセズ')
          audio2.play()
          XSlastTime = Date.now()
          recognition.stop()
          setTimeout(() => {
            recognition.start()
          }, 300)
          setTimeout(() => {
            recognition.start()
          }, 500)
        }
      }

      if (event.results[i].isFinal) {
        finalTranscript += transcript
      } else {
        interimTranscript = transcript
      }
    }
    resultDiv.innerHTML = finalTranscript + '<i style="color:#ddd;">' + interimTranscript + '</i>'
  }
  recognition.error = (event: any) => {
    console.log('エラーが発生しました。', event.error)
    buttonState.changeState('start')
  }
  //録音が終了したら、ボタンのテキストをstartにする
  recognition.onend = () => {
    buttonState.changeState('start')
    console.log('音声認識が終了しました。')
  }
}
main()
