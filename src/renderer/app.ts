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
});

function showSettingsModal() {
  const modal = document.getElementById('settingsModal') as HTMLDivElement;
  modal.style.display = 'flex';
}

function hideSettingsModal() {
  const modal = document.getElementById('settingsModal') as HTMLDivElement;
  modal.style.display = 'none';
}

function initApp() {
  console.log('initApp called');

  // DOM要素取得
  const editor = document.getElementById('editor') as HTMLTextAreaElement;
  const openFileBtn = document.getElementById('openFile') as HTMLButtonElement;
  const saveFileBtn = document.getElementById('saveFile') as HTMLButtonElement;
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
      // 1チャンクのみ生成（再生用）
      const result = await (window as any).electron.tts.convert({
        text: selectedText,
        voice: voiceSelect.value,
        instructions: instructions.value,
        startLine: 1,
      });

      if (result.success && result.files.length > 0) {
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
