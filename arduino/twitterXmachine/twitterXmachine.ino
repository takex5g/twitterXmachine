/**
 * TwitterXmachine - Arduino受信コード
 *
 * Webアプリからシリアル通信で送信される値（1-4）を受信し、
 * 対応するピンを40ms間HIGHにする
 *
 * 対象ボード: Seeed XIAO RP2040
 */

// ピン定義
const int PIN_TWITTER = D7;   // D7: Twitter (受信値 '1')
const int PIN_TWEET   = D8;   // D8: ツイート (受信値 '2')
const int PIN_RETWEET = D9;   // D9: リツイート (受信値 '3')
const int PIN_QUOTE   = D10;  // D10: 引用ツイート (受信値 '4')

// パルス幅（ミリ秒）
const unsigned long PULSE_DURATION = 80;

// ピン配列（インデックスで管理）
const int OUTPUT_PINS[] = {PIN_TWITTER, PIN_TWEET, PIN_RETWEET, PIN_QUOTE};
const int NUM_PINS = 4;

// デバッグ用ラベル
const char* LABELS[] = {"Twitter", "Tweet", "Retweet", "Quote"};

void setup() {
  // シリアル通信初期化（9600bps）
  Serial.begin(9600);

  // ピンモード設定
  for (int i = 0; i < NUM_PINS; i++) {
    pinMode(OUTPUT_PINS[i], OUTPUT);
    digitalWrite(OUTPUT_PINS[i], LOW);
  }

  Serial.println("TwitterXmachine Ready!");
  Serial.println("Waiting for serial data (1-4)...");
}

void loop() {
  // シリアルデータがあれば処理
  if (Serial.available() > 0) {
    char received = Serial.read();

    // '1'〜'4' の範囲かチェック
    if (received >= '1' && received <= '4') {
      int index = received - '1';  // '1'->0, '2'->1, '3'->2, '4'->3
      int pin = OUTPUT_PINS[index];

      // デバッグ出力
      Serial.print("Received: ");
      Serial.print(received);
      Serial.print(" -> ");
      Serial.print(LABELS[index]);
      Serial.print(" (D");
      Serial.print(pin);
      Serial.println(")");

      // ピンをHIGHにしてパルス出力
      digitalWrite(pin, HIGH);
      delay(PULSE_DURATION);
      digitalWrite(pin, LOW);
    }
  }
}
