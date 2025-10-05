/**
 * テキストを指定された最大文字数で分割
 * @param text 分割するテキスト
 * @param maxChars チャンクあたりの最大文字数（デフォルト: 1024）
 * @returns 分割されたテキストの配列
 */
export function splitText(text: string, maxChars: number = 1024): string[] {
  const chunks: string[] = [];

  // 改行で分割
  const lines = text.split('\n');
  let currentChunk = '';

  for (const line of lines) {
    // 1行が最大文字数を超える場合
    if (line.length > maxChars) {
      // 現在のチャンクを保存
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }

      // 長い行を文字単位で分割
      for (let i = 0; i < line.length; i += maxChars) {
        chunks.push(line.substring(i, i + maxChars));
      }
      continue;
    }

    // 現在のチャンクに行を追加すると最大を超える場合
    if (currentChunk.length + line.length + 1 > maxChars) {
      chunks.push(currentChunk);
      currentChunk = line;
    } else {
      currentChunk += (currentChunk ? '\n' : '') + line;
    }
  }

  // 残りのチャンクを追加
  if (currentChunk) {
    chunks.push(currentChunk);
  }

  return chunks;
}
