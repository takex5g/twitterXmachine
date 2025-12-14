/**
 * シリアル通信マネージャー
 * Web Serial APIを使用してシリアル通信を行う
 */
export class SerialManager {
  private port: SerialPort | null = null
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private _isConnected = false

  get isConnected(): boolean {
    return this._isConnected
  }

  /**
   * シリアルポートに接続する
   * ユーザーにポート選択ダイアログを表示
   */
  async connect(baudRate = 9600): Promise<boolean> {
    try {
      // Web Serial APIがサポートされているか確認
      if (!('serial' in navigator)) {
        alert('このブラウザはシリアル通信に対応していません')
        return false
      }

      // ポート選択ダイアログを表示
      this.port = await navigator.serial.requestPort()
      await this.port.open({ baudRate })

      // Writerを取得
      const outputStream = this.port.writable
      if (outputStream) {
        this.writer = outputStream.getWriter()
      }

      this._isConnected = true
      return true
    } catch (error) {
      console.error('シリアルポート接続エラー:', error)
      this._isConnected = false
      return false
    }
  }

  /**
   * データを送信する
   */
  async send(data: string): Promise<void> {
    if (!this.writer) {
      console.warn('シリアルポートが接続されていません')
      return
    }

    try {
      const encoder = new TextEncoder()
      await this.writer.write(encoder.encode(data))
    } catch (error) {
      console.error('シリアル送信エラー:', error)
    }
  }

  /**
   * 接続を切断する
   */
  async disconnect(): Promise<void> {
    try {
      if (this.writer) {
        this.writer.releaseLock()
        this.writer = null
      }
      if (this.port) {
        await this.port.close()
        this.port = null
      }
      this._isConnected = false
    } catch (error) {
      console.error('シリアル切断エラー:', error)
    }
  }
}
