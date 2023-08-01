// ボタンのstart,stopの切り替えをするクラス

type startStop = 'start' | 'stop'

export class ButtonState {
  private _state: startStop
  private _element: HTMLElement
  constructor(element: HTMLElement) {
    this._state = 'start'
    this._element = element
  }
  public changeState(state: startStop) {
    this._state = state
    this._element.textContent = state
    if (state === 'start') {
      this._element.classList.remove('stop')
      this._element.classList.add('start')
    }
    if (state === 'stop') {
      this._element.classList.remove('start')
      this._element.classList.add('stop')
    }
  }
  public getState() {
    return this._state
  }

  //startイベントを登録する
  public addEvent(start: () => void, stop: () => void) {
    this._element.addEventListener('click', () => {
      if (this._state === 'start') {
        start()
        this.changeState('stop')
      } else {
        stop()
        this.changeState('start')
      }
    })
  }
}
