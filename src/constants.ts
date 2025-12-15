// 時間関連の定数（ミリ秒）
export const DISPLAY_DURATION_MS = 3000 // 訂正表示の表示時間

// ベースURL（Viteが自動的に設定）
const BASE_URL = import.meta.env.BASE_URL

// 認識対象の単語タイプ
export const WORD_TYPES = ['X', 'POST', 'REPOST'] as const
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
    audioPath: `${BASE_URL}/audio/X.wav`,
    words: ['Twitter', 'ツイッター', 'ついったー', 'ついった', 'ついたー'],
    excludeWords: [],
    className: 'show-x',
  },
  REPOST: {
    audioPath: `${BASE_URL}/audio/repost.wav`,
    words: ['リツイート', 'りついーと', 'りついと'],
    excludeWords: [],
    className: 'show-repost',
  },
  POST: {
    audioPath: `${BASE_URL}/audio/post.wav`,
    words: ['ツイート', 'ついーと', 'ついと'],
    excludeWords: ['リツイート', 'りついーと', 'りついと'],
    className: 'show-post',
  },
}
