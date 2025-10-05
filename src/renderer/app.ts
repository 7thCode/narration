/// <reference lib="dom" />

console.log('app.ts loaded');
console.log('window.electron:', (window as any).electron);

// DOMContentLoaded後に実行
document.addEventListener('DOMContentLoaded', async () => {
  console.log('DOMContentLoaded');

  // API Key確認
  const hasApiKey = await (window as any).electron.settings.hasApiKey();
  if (!hasApiKey) {
    showApiKeyModal();
  }

  initApp();
});

function showApiKeyModal() {
  const modal = document.getElementById('apiKeyModal') as HTMLDivElement;
  modal.style.display = 'flex';
}

function hideApiKeyModal() {
  const modal = document.getElementById('apiKeyModal') as HTMLDivElement;
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
  const settingsButton = document.getElementById('settingsButton') as HTMLButtonElement;
  const apiKeyInput = document.getElementById('apiKeyInput') as HTMLInputElement;
  const saveApiKeyBtn = document.getElementById('saveApiKey') as HTMLButtonElement;
  const cancelApiKeyBtn = document.getElementById('cancelApiKey') as HTMLButtonElement;
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

  // API Key設定
  settingsButton.addEventListener('click', () => {
    showApiKeyModal();
  });

  saveApiKeyBtn.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    if (!apiKey) {
      alert('API Keyを入力してください');
      return;
    }
    await (window as any).electron.settings.setApiKey(apiKey);
    hideApiKeyModal();
    apiKeyInput.value = '';
    showStatus('API Keyを保存しました', 'success');
  });

  cancelApiKeyBtn.addEventListener('click', async () => {
    const hasApiKey = await (window as any).electron.settings.hasApiKey();
    if (!hasApiKey) {
      alert('API Keyが設定されていません。アプリを使用するにはAPI Keyが必要です。');
      return;
    }
    hideApiKeyModal();
    apiKeyInput.value = '';
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
