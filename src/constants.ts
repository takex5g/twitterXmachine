// 時間関連の定数（ミリ秒）
export const COOLDOWN_MS = 3000 // 同じ単語に反応するまでのクールダウン
export const DISPLAY_DURATION_MS = 3000 // 訂正表示の表示時間

// テキスト処理の定数
export const MAX_TRANSCRIPT_LENGTH = 15 // この長さを超えたら末尾を切り取る
export const TRANSCRIPT_SLICE_OFFSET = 6 // 切り取り時のオフセット

// 認識対象の単語タイプ
export const WORD_TYPES = ['X', 'XS', 'REPOST', 'QUOTE'] as const
export type WordType = (typeof WORD_TYPES)[number]

// 各単語タイプの設定
export const WORD_DEFINITIONS: Record<
  WordType,
  {
    audioPath: string
    words: string[]
    excludeWords: string[]
    className: string
  }
> = {
  X: {
    audioPath: '/src/X.wav',
    words: ['Twitter', 'ツイッター', 'ついったー', 'ついった', 'ついたー'],
    excludeWords: [],
    className: 'show-x',
  },
  REPOST: {
    audioPath: '/src/repost.wav',
    words: ['リツイート', 'りついーと', 'りついと'],
    excludeWords: ['引用リツイート', '引用りついーと', '引用りついと'],
    className: 'show-repost',
  },
  XS: {
    audioPath: '/src/Xs.wav',
    words: ['ツイート', 'ついーと', 'ついと'],
    excludeWords: ['リツイート', 'りついーと', 'りついと', '引用ツイート', '引用ついーと', '引用ついと'],
    className: 'show-xs',
  },
  QUOTE: {
    audioPath: '/src/quote.wav',
    words: ['引用ツイート', '引用ついーと', '引用ついと', '引用リツイート', '引用りついーと', '引用りついと'],
    excludeWords: [],
    className: 'show-quote',
  },
}
