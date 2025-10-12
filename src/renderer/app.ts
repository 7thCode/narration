/// <reference lib="dom" />

console.log('app.ts loaded');
console.log('window.electron:', (window as any).electron);

// DOMContentLoaded後に実行
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded');

  // API Key確認
  const hasApiKey = await (window as any).electron.settings.hasApiKey();
  if (!hasApiKey) {
    showSettingsModal();
  }

  initApp();

  // メニューイベントリスナー（initAppの外で定義）
  (window as any).electron.ipcRenderer.on('menu:file:open', () => {
    const openFileBtn = document.getElementById('openFile') as HTMLButtonElement;
    openFileBtn?.click();
  });

  (window as any).electron.ipcRenderer.on('menu:file:save', () => {
    const saveFileBtn = document.getElementById('saveFile') as HTMLButtonElement;
    saveFileBtn?.click();
  });

  (window as any).electron.ipcRenderer.on('menu:file:saveas', () => {
    const saveAsFileBtn = document.getElementById('saveAsFile') as HTMLButtonElement;
    saveAsFileBtn?.click();
  });

  (window as any).electron.ipcRenderer.on('menu:tools:maintext', () => {
    const mainTextButton = document.getElementById('mainTextButton') as HTMLButtonElement;
    mainTextButton?.click();
  });

  (window as any).electron.ipcRenderer.on('menu:tools:kanji', () => {
    const kanjiButton = document.getElementById('kanjiButton') as HTMLButtonElement;
    kanjiButton?.click();
  });

  (window as any).electron.ipcRenderer.on('menu:tools:furigana', () => {
    const furiganaButton = document.getElementById('furiganaButton') as HTMLButtonElement;
    furiganaButton?.click();
  });

  (window as any).electron.ipcRenderer.on('menu:tools:br', () => {
    const brConvertButton = document.getElementById('brConvertButton') as HTMLButtonElement;
    brConvertButton?.click();
  });

  (window as any).electron.ipcRenderer.on('menu:tools:ruby', () => {
    const rubyConvertButton = document.getElementById('rubyConvertButton') as HTMLButtonElement;
    rubyConvertButton?.click();
  });

  (window as any).electron.ipcRenderer.on('menu:tools:hiragana', () => {
    const hiraganaButton = document.getElementById('hiraganaButton') as HTMLButtonElement;
    hiraganaButton?.click();
  });

  (window as any).electron.ipcRenderer.on('menu:edit:find', () => {
    showSearchReplaceModal();
  });
});

function showSettingsModal() {
  const modal = document.getElementById('settingsModal') as HTMLDivElement;
  modal.style.display = 'flex';
}

function hideSettingsModal() {
  const modal = document.getElementById('settingsModal') as HTMLDivElement;
  modal.style.display = 'none';
}

function showSearchReplaceModal() {
  const modal = document.getElementById('searchReplaceModal') as HTMLDivElement;
  modal.style.display = 'flex';
  // 検索入力にフォーカス
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  searchInput?.focus();
}

function hideSearchReplaceModal() {
  const modal = document.getElementById('searchReplaceModal') as HTMLDivElement;
  modal.style.display = 'none';
}

// 検索機能の状態管理
let lastSearchQuery = '';
let lastSearchIndex = -1;

// セッション使用量トラッキング
let sessionTotalChars = 0;

function updateUsageStats(charCount: number, model: string = 'tts-1') {
  sessionTotalChars += charCount;
  
  // モデル別料金 (per 1K chars)
  const rates = {
    'tts-1': 0.015,
    'tts-1-hd': 0.030,
  };
  
  const rate = rates[model as keyof typeof rates] || rates['tts-1'];
  const cost = (sessionTotalChars / 1000) * rate;
  
  // UI更新
  const sessionCharsEl = document.getElementById('sessionChars');
  const sessionCostEl = document.getElementById('sessionCost');
  
  if (sessionCharsEl) sessionCharsEl.textContent = sessionTotalChars.toLocaleString();
  if (sessionCostEl) sessionCostEl.textContent = `$${cost.toFixed(4)}`;
}

function initApp() {
  console.log('initApp called');

  // DOM要素取得
  const editor = document.getElementById('editor') as HTMLTextAreaElement;
  const openFileBtn = document.getElementById('openFile') as HTMLButtonElement;
  const saveFileBtn = document.getElementById('saveFile') as HTMLButtonElement;
  const saveAsFileBtn = document.getElementById('saveAsFile') as HTMLButtonElement;
  const kanjiButton = document.getElementById('kanjiButton') as HTMLButtonElement;
  const furiganaButton = document.getElementById('furiganaButton') as HTMLButtonElement;
  const brConvertButton = document.getElementById('brConvertButton') as HTMLButtonElement;
  const rubyConvertButton = document.getElementById('rubyConvertButton') as HTMLButtonElement;
  const hiraganaButton = document.getElementById('hiraganaButton') as HTMLButtonElement;
  const mainTextButton = document.getElementById('mainTextButton') as HTMLButtonElement;
  const playButton = document.getElementById('playButton') as HTMLButtonElement;
  const settingsButton = document.getElementById('settingsButton') as HTMLButtonElement;
  const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
  const saveSettingsBtn = document.getElementById('saveSettings') as HTMLButtonElement;
  const cancelSettingsBtn = document.getElementById('cancelSettings') as HTMLButtonElement;
  const voiceSelect = document.getElementById('voiceSelect') as HTMLSelectElement;
  const instructions = document.getElementById('instructions') as HTMLTextAreaElement;
  const convertButton = document.getElementById('convertButton') as HTMLButtonElement;
  const cancelButton = document.getElementById('cancelButton') as HTMLButtonElement;
  const progressContainer = document.getElementById('progressContainer') as HTMLDivElement;
  const progressBar = document.getElementById('progressBar') as HTMLProgressElement;
  const progressText = document.getElementById('progressText') as HTMLDivElement;
  const statusDiv = document.getElementById('status') as HTMLDivElement;
  const audioSection = document.getElementById('audioSection') as HTMLDivElement;
  const audioFiles = document.getElementById('audioFiles') as HTMLDivElement;

  console.log('Elements:', { editor, openFileBtn, saveFileBtn });

  // 設定モーダル
  settingsButton.addEventListener('click', async () => {
    // 現在の設定を読み込んで表示
    const apiKey = await (window as any).electron.settings.getApiKey();
    apiKeyInput.value = apiKey || '';
    showSettingsModal();
  });

  // 設定保存
  saveSettingsBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();

    if (apiKey) {
      await (window as any).electron.settings.setApiKey(apiKey);
    }

    hideSettingsModal();
    showStatus('設定を保存しました', 'success');
  });

  // 設定キャンセル
  cancelSettingsBtn.addEventListener('click', async () => {
    const hasApiKey = await (window as any).electron.settings.hasApiKey();
    if (!hasApiKey) {
      alert('API Keyが設定されていません。アプリを使用するにはAPI Keyが必要です。');
      return;
    }
    hideSettingsModal();
  });

  // 検索・置換モーダルの要素取得
  const searchInput = document.getElementById('searchInput') as HTMLInputElement;
  const replaceInput = document.getElementById('replaceInput') as HTMLInputElement;
  const caseSensitiveCheck = document.getElementById('caseSensitiveCheck') as HTMLInputElement;
  const regexCheck = document.getElementById('regexCheck') as HTMLInputElement;
  const findNextButton = document.getElementById('findNextButton') as HTMLButtonElement;
  const replaceButton = document.getElementById('replaceButton') as HTMLButtonElement;
  const replaceAllButton = document.getElementById('replaceAllButton') as HTMLButtonElement;
  const closeSearchButton = document.getElementById('closeSearchButton') as HTMLButtonElement;
  const searchStatus = document.getElementById('searchStatus') as HTMLDivElement;

  // 検索ステータス表示
  function showSearchStatus(message: string, isError: boolean = false) {
    searchStatus.textContent = message;
    searchStatus.style.display = 'block';
    searchStatus.style.background = isError ? '#3d1a1a' : '#1a3d1a';
    searchStatus.style.color = isError ? '#ff7575' : '#75ff75';
    
    setTimeout(() => {
      searchStatus.style.display = 'none';
    }, 3000);
  }

  // 検索実行
  function findNext() {
    const query = searchInput.value;
    if (!query) {
      showSearchStatus('検索文字列を入力してください', true);
      return;
    }

    const text = editor.value;
    const caseSensitive = caseSensitiveCheck.checked;
    const useRegex = regexCheck.checked;

    // 検索クエリが変わった場合はリセット
    if (query !== lastSearchQuery) {
      lastSearchQuery = query;
      lastSearchIndex = -1;
    }

    let foundIndex = -1;

    try {
      if (useRegex) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(query, flags);
        const matches = [...text.matchAll(regex)];
        
        if (matches.length === 0) {
          showSearchStatus('見つかりませんでした', true);
          lastSearchIndex = -1;
          return;
        }

        // 次のマッチを探す
        const currentPos = editor.selectionEnd;
        let nextMatch = matches.find(m => m.index !== undefined && m.index > currentPos);
        
        if (!nextMatch) {
          // 最初に戻る
          nextMatch = matches[0];
          showSearchStatus(`最初に戻りました (${matches.length}件)`, false);
        } else {
          showSearchStatus(`${matches.length}件中`, false);
        }

        if (nextMatch && nextMatch.index !== undefined) {
          foundIndex = nextMatch.index;
          editor.focus();
          editor.setSelectionRange(foundIndex, foundIndex + nextMatch[0].length);
          lastSearchIndex = foundIndex;
        }
      } else {
        // 通常検索
        const searchText = caseSensitive ? text : text.toLowerCase();
        const searchQuery = caseSensitive ? query : query.toLowerCase();
        
        foundIndex = searchText.indexOf(searchQuery, lastSearchIndex + 1);
        
        if (foundIndex === -1 && lastSearchIndex !== -1) {
          // 最初から再検索
          foundIndex = searchText.indexOf(searchQuery, 0);
          if (foundIndex !== -1) {
            showSearchStatus('最初に戻りました', false);
          }
        }

        if (foundIndex !== -1) {
          editor.focus();
          editor.setSelectionRange(foundIndex, foundIndex + query.length);
          lastSearchIndex = foundIndex;
          showSearchStatus('見つかりました', false);
        } else {
          showSearchStatus('見つかりませんでした', true);
          lastSearchIndex = -1;
        }
      }
    } catch (error: any) {
      showSearchStatus(`正規表現エラー: ${error.message}`, true);
    }
  }

  // 置換実行
  function replaceOne() {
    const query = searchInput.value;
    const replacement = replaceInput.value;
    
    if (!query) {
      showSearchStatus('検索文字列を入力してください', true);
      return;
    }

    const selStart = editor.selectionStart;
    const selEnd = editor.selectionEnd;
    const selectedText = editor.value.substring(selStart, selEnd);

    const caseSensitive = caseSensitiveCheck.checked;
    const useRegex = regexCheck.checked;

    let matches = false;

    try {
      if (useRegex) {
        const flags = caseSensitive ? '' : 'i';
        const regex = new RegExp(query, flags);
        matches = regex.test(selectedText);
      } else {
        const compareSelected = caseSensitive ? selectedText : selectedText.toLowerCase();
        const compareQuery = caseSensitive ? query : query.toLowerCase();
        matches = compareSelected === compareQuery;
      }

      if (matches) {
        // 選択範囲を置換
        const before = editor.value.substring(0, selStart);
        const after = editor.value.substring(selEnd);
        
        let replacedText = replacement;
        if (useRegex) {
          const flags = caseSensitive ? '' : 'i';
          const regex = new RegExp(query, flags);
          replacedText = selectedText.replace(regex, replacement);
        }
        
        editor.value = before + replacedText + after;
        editor.setSelectionRange(selStart, selStart + replacedText.length);
        showSearchStatus('置換しました', false);
        
        // 次を検索
        lastSearchIndex = selStart + replacedText.length - 1;
        setTimeout(() => findNext(), 100);
      } else {
        // 一致していない場合は次を検索
        findNext();
      }
    } catch (error: any) {
      showSearchStatus(`正規表現エラー: ${error.message}`, true);
    }
  }

  // すべて置換
  function replaceAll() {
    const query = searchInput.value;
    const replacement = replaceInput.value;
    
    if (!query) {
      showSearchStatus('検索文字列を入力してください', true);
      return;
    }

    const caseSensitive = caseSensitiveCheck.checked;
    const useRegex = regexCheck.checked;

    try {
      let newText = editor.value;
      let count = 0;

      if (useRegex) {
        const flags = caseSensitive ? 'g' : 'gi';
        const regex = new RegExp(query, flags);
        const matches = newText.match(regex);
        count = matches ? matches.length : 0;
        newText = newText.replace(regex, replacement);
      } else {
        const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(
          escapedQuery,
          caseSensitive ? 'g' : 'gi'
        );
        const matches = newText.match(regex);
        count = matches ? matches.length : 0;
        newText = newText.replace(regex, replacement);
      }

      if (count > 0) {
        editor.value = newText;
        showSearchStatus(`${count}件を置換しました`, false);
        lastSearchIndex = -1;
        lastSearchQuery = '';
      } else {
        showSearchStatus('見つかりませんでした', true);
      }
    } catch (error: any) {
      showSearchStatus(`正規表現エラー: ${error.message}`, true);
    }
  }

  // イベントリスナー
  findNextButton.addEventListener('click', findNext);
  replaceButton.addEventListener('click', replaceOne);
  replaceAllButton.addEventListener('click', replaceAll);
  closeSearchButton.addEventListener('click', hideSearchReplaceModal);

  // Enterキーで検索
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      findNext();
    }
  });

  // Shift+Enterで置換
  replaceInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (e.shiftKey) {
        replaceAll();
      } else {
        replaceOne();
      }
    }
  });

  // Escapeキーで閉じる
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('searchReplaceModal') as HTMLDivElement;
    if (e.key === 'Escape' && modal.style.display === 'flex') {
      hideSearchReplaceModal();
    }
  });

  // ルビフィルター機能
  kanjiButton.addEventListener('click', () => {
    const text = editor.value;
    const kanjiRegex = /<ruby><rb>(.*?)<\/rb>.*?<\/ruby>/g;
    const filtered = text.replace(kanjiRegex, '$1');
    editor.value = filtered;
    showStatus('漢字のみ抽出しました', 'success');
  });

  furiganaButton.addEventListener('click', () => {
    const text = editor.value;
    const furiganaRegex = /<ruby><rb>.*?<\/rb><rp>（<\/rp><rt>(.*?)<\/rt><rp>）<\/rp><\/ruby>/g;
    const filtered = text.replace(furiganaRegex, '$1');
    editor.value = filtered;
    showStatus('ふりがなのみ抽出しました', 'success');
  });

  // <br />を改行に変換
  brConvertButton.addEventListener('click', () => {
    const text = editor.value;
    const converted = text.replace(/<br\s*\/?>/gi, '\n');
    editor.value = converted;
    showStatus('<br />を改行に変換しました', 'success');
  });

  // ルビタグを「漢字（ふりがな）」形式に変換
  rubyConvertButton.addEventListener('click', () => {
    const text = editor.value;
    const rubyRegex = /<ruby><rb>(.*?)<\/rb><rp>（<\/rp><rt>(.*?)<\/rt><rp>）<\/rp><\/ruby>/g;
    const converted = text.replace(rubyRegex, '$1（$2）');
    editor.value = converted;
    showStatus('ルビタグを変換しました', 'success');
  });

  // ひらがな変換（Go + Kagome）
  hiraganaButton.addEventListener('click', async () => {
    const selectedText = editor.value.substring(
      editor.selectionStart,
      editor.selectionEnd
    );
    const textToConvert = selectedText || editor.value;

    if (!textToConvert) {
      showStatus('変換するテキストがありません', 'error');
      return;
    }

    showStatus('ひらがなに変換中...', 'success');

    try {
      const result = await (window as any).electron.go.convertToHiragana(textToConvert);

      if (result.success && result.output) {
        if (selectedText) {
          // 選択範囲のみ置換
          const before = editor.value.substring(0, editor.selectionStart);
          const after = editor.value.substring(editor.selectionEnd);
          editor.value = before + result.output + after;
        } else {
          // 全体を置換
          editor.value = result.output;
        }
        showStatus('✅ ひらがな変換完了', 'success');
      } else {
        showStatus(`❌ 変換エラー: ${result.error || 'Unknown error'}`, 'error');
      }
    } catch (error: any) {
      showStatus(`❌ 変換エラー: ${error.message}`, 'error');
    }
  });

  // main_text抽出
  mainTextButton.addEventListener('click', () => {
    const text = editor.value;
    
    try {
      // DOMParserでHTMLをパース
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/html');
      
      // <div class="main_text">を取得
      const mainTextDiv = doc.querySelector('div.main_text');
      
      if (mainTextDiv) {
        // innerHTML（内側のみ）を抽出
        editor.value = mainTextDiv.innerHTML;
        showStatus('✅ <div class="main_text">の内容を抽出しました', 'success');
      } else {
        showStatus('❌ <div class="main_text">が見つかりませんでした', 'error');
      }
    } catch (error: any) {
      showStatus(`❌ エラー: ${error.message}`, 'error');
    }
  });

  // 音声再生（選択範囲）
  let currentAudio: HTMLAudioElement | null = null;
  
  playButton.addEventListener('click', async () => {
    const selectedText = editor.value.substring(
      editor.selectionStart,
      editor.selectionEnd
    );

    if (!selectedText) {
      showStatus('❌ テキストを選択してください', 'error');
      return;
    }

    // 既存の音声を停止
    if (currentAudio) {
      currentAudio.pause();
      currentAudio = null;
    }

    showStatus('🎵 音声を生成中...', 'success');
    playButton.disabled = true;

    try {
      // 使用量をカウント
      const charCount = selectedText.length;
      
      // 1チャンクのみ生成（再生用）
      const result = await (window as any).electron.tts.convert({
        text: selectedText,
        voice: voiceSelect.value,
        instructions: instructions.value,
        startLine: 1,
      });

      if (result.success && result.files.length > 0) {
        // 使用量を更新
        updateUsageStats(charCount, 'tts-1');
        // 最初のファイルを再生
        const audioFile = result.files[0];
        currentAudio = new Audio(audioFile);
        
        currentAudio.onended = () => {
          showStatus('✅ 再生完了', 'success');
          playButton.disabled = false;
        };

        currentAudio.onerror = () => {
          showStatus('❌ 再生エラー', 'error');
          playButton.disabled = false;
        };

        await currentAudio.play();
        showStatus('🎵 再生中...', 'success');
      } else {
        showStatus(`❌ エラー: ${result.error}`, 'error');
        playButton.disabled = false;
      }
    } catch (error: any) {
      showStatus(`❌ エラー: ${error.message}`, 'error');
      playButton.disabled = false;
    }
  });

  // ファイル操作
  openFileBtn.addEventListener('click', async () => {
    console.log('Open file clicked');
    const result = await (window as any).electron.file.open();
    if (result.success) {
      editor.value = result.content;
      showStatus(`ファイルを開きました: ${result.filePath}`, 'success');
    } else if (result.error !== 'Cancelled') {
      showStatus(`エラー: ${result.error}`, 'error');
    }
  });

  saveFileBtn.addEventListener('click', async () => {
    console.log('Save file clicked');
    const result = await (window as any).electron.file.save(editor.value);
    if (result.success) {
      showStatus(`ファイルを保存しました: ${result.filePath}`, 'success');
    } else if (result.error !== 'Cancelled') {
      showStatus(`エラー: ${result.error}`, 'error');
    }
  });

  saveAsFileBtn.addEventListener('click', async () => {
    console.log('Save As file clicked');
    const result = await (window as any).electron.file.saveAs(editor.value);
    if (result.success) {
      showStatus(`ファイルを保存しました: ${result.filePath}`, 'success');
    } else if (result.error !== 'Cancelled') {
      showStatus(`エラー: ${result.error}`, 'error');
    }
  });

  // TTS変換
  convertButton.addEventListener('click', async () => {
    console.log('Convert clicked');
    const selectedText = editor.value.substring(
      editor.selectionStart,
      editor.selectionEnd
    );

    if (!selectedText) {
      showStatus('テキストを選択してください', 'error');
      return;
    }

    // 選択開始位置の行数を計算
    const textBeforeSelection = editor.value.substring(0, editor.selectionStart);
    const startLine = textBeforeSelection.split('\n').length;

    // UI状態変更
    convertButton.style.display = 'none';
    cancelButton.style.display = 'block';
    progressContainer.style.display = 'block';
    progressBar.value = 0;
    progressText.textContent = '変換を開始しています...';
    statusDiv.style.display = 'none';

    try {
      const result = await (window as any).electron.tts.convert({
        text: selectedText,
        voice: voiceSelect.value,
        instructions: instructions.value,
        startLine: startLine,
      });

    if (result.success) {
      // 使用量を更新
      updateUsageStats(selectedText.length, 'tts-1');
      showStatus(
        `✅ 変換完了\n生成されたファイル:\n${result.files.join('\n')}`,
        'success'
      );
      displayAudioFiles(result.files);
    } else {
      showStatus(`❌ エラー: ${result.error}`, 'error');
    }
  } catch (error: any) {
    showStatus(`❌ エラー: ${error.message}`, 'error');
  } finally {
    // UI状態を戻す
    convertButton.style.display = 'block';
    cancelButton.style.display = 'none';
    progressContainer.style.display = 'none';
  }
});

  // キャンセル
  cancelButton.addEventListener('click', () => {
    console.log('Cancel clicked');
    (window as any).electron.tts.cancel();
    showStatus('変換をキャンセルしました', 'error');
    convertButton.style.display = 'block';
    cancelButton.style.display = 'none';
    progressContainer.style.display = 'none';
  });

  // 進捗更新
  (window as any).electron.tts.onProgress((progress: { current: number; total: number }) => {
    progressBar.max = progress.total;
    progressBar.value = progress.current;
    progressText.textContent = `チャンク ${progress.current} / ${progress.total} を処理中...`;
  });

  // ステータス表示
  function showStatus(message: string, type: 'success' | 'error') {
    statusDiv.textContent = message;
    statusDiv.className = `status ${type}`;
    statusDiv.style.display = 'block';
  }

  // 音声ファイル表示
  function displayAudioFiles(files: string[]) {
    audioFiles.innerHTML = '';
    audioSection.style.display = 'block';

    files.forEach((filename) => {
      const container = document.createElement('div');
      container.className = 'audio-file';

      const nameDiv = document.createElement('div');
      nameDiv.className = 'audio-file-name';
      nameDiv.textContent = filename;

      const audio = document.createElement('audio');
      audio.controls = true;
      audio.src = filename;

      container.appendChild(nameDiv);
      container.appendChild(audio);
      audioFiles.appendChild(container);
    });
  }

}
