const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const { spawn } = require('child_process');
const path = require('path');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    width: 600,
    height: 400,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });
  win.loadFile('index.html');
});

// Handle file selection
ipcMain.handle('select-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Audio', extensions: [] }]
  });
  return result.filePaths[0];
});

// Handle transcription
ipcMain.handle('transcribe', async (event, audioPath) => {
  return new Promise((resolve, reject) => {
    // Paths to whisper.exe and model (adjust to your setup)
    const whisperPath = path.join(__dirname, 'resources', 'whisper-cli.exe');
    const modelPath = path.join(__dirname, 'resources/models', 'ggml-base.en.bin'); // base model, English only
    
    // Spawn whisper process
    const whisper = spawn(whisperPath, [
      '-m', modelPath,        // Model path
      '-f', audioPath,        // Audio file
      '-t', '8',              // Threads
      '-l', 'en',             // Language (English)
      '-di',                  // Diarization
      '--no-timestamps'       // No timestamps in output
    ]);
    
    let output = '';
    let errors = '';
    
    // Collect stdout
    whisper.stdout.on('data', data => {
      output += data.toString();
    });
    
    // Collect stderr (whisper outputs progress here)
    whisper.stderr.on('data', data => {
      errors += data.toString();
      // Send progress updates
      event.sender.send('progress', data.toString());
    });
    
    // Handle completion
    whisper.on('close', code => {
      if (code === 0) {
        // Extract transcription text (filter out metadata lines)
        const text = output
          .split('\n')
          .filter(line => line.trim() && !line.includes('['))
          .join(' ')
          .trim();
        resolve(text);
      } else {
        reject(new Error(`Whisper failed: ${errors}`));
      }
    });
  });
});