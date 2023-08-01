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
  const audios = {
    X: new Audio('/src/X.wav'),
    XS: new Audio('/src/Xs.wav'),
  }
  //ボタンのstart,stopの切り替えをするクラス
  const buttonState = new ButtonState(document.getElementById('start-btn') as HTMLElement)
  //認識が開始されたら、ボタンのテキストをstopにする
  buttonState.addEvent(
    () => {
      recognition.start()
      // X.wavを読み込む
      audios.X = new Audio('/src/X.wav')
      audios.XS = new Audio('/src/Xs.wav')
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

      const transcript = event.results[event.results.length - 1][0].transcript
      console.log(event.results)
      if (Date.now() - XlastTime > 1000) {
        if (twitterWords.some((word) => transcript.includes(word))) {
          console.log('X', i)
          XlastTime = Date.now()
          xContainer.classList.add('show-x')
          audios.X.play()
          setTimeout(() => {
            xContainer.classList.remove('show-x')
          }, 3000)
        }
      }
      if (Date.now() - XSlastTime > 1000) {
        if (tweetWords.some((word) => transcript.includes(word))) {
          console.log('エクセズ')
          XSlastTime = Date.now()
          xContainer.classList.add('show-xs')
          audios.XS.play()
          setTimeout(() => {
            xContainer.classList.remove('show-xs')
          }, 3000)
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
