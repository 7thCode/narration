/**
 * Markdown記号を削除して、プレーンテキストに変換する
 * TTS変換時に使用
 */
export function cleanMarkdown(text: string): string {
  return text
    // 見出し (# ## ### など)
    .replace(/^#{1,6}\s+/gm, '')
    // 太字 (**text** or __text__)
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/__(.+?)__/g, '$1')
    // イタリック (*text* or _text_)
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/_(.+?)_/g, '$1')
    // 取り消し線 (~~text~~)
    .replace(/~~(.+?)~~/g, '$1')
    // リスト (-, *, +)
    .replace(/^\s*[-*+]\s+/gm, '')
    // 番号付きリスト (1. 2. 3.)
    .replace(/^\s*\d+\.\s+/gm, '')
    // リンク [text](url) → text
    .replace(/\[(.+?)\]\(.+?\)/g, '$1')
    // インラインコード (`code`)
    .replace(/`(.+?)`/g, '$1')
    // コードブロック (```code```)
    .replace(/^```[\s\S]*?```$/gm, '')
    // 引用 (>)
    .replace(/^\>\s+/gm, '')
    // 水平線 (---, ***, ___)
    .replace(/^[\-*_]{3,}$/gm, '')
    // HTMLタグを削除 (<tag>)
    .replace(/<[^>]+>/g, '')
    // 余分な空白を整理
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
