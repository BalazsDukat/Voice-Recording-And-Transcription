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
    filters: [{ name: 'Audio', extensions: ['wav'] }]
  });
  return result.filePaths[0];
});



// Handle transcription
ipcMain.handle('transcribe', async (event, wavBuffer) => {
  return new Promise((resolve, reject) => {
    // Save WAV to temp file
    const tempPath = path.join(app.getPath('temp'), `audio-${Date.now()}.wav`);
    fs.writeFileSync(tempPath, Buffer.from(wavBuffer));
    
    // Paths to whisper.exe and model
    const whisperPath = path.join(__dirname, 'resources', 'whisper.exe');
<<<<<<< HEAD
    const modelPath = path.join(__dirname, 'resources', 'ggml-base.bin');
=======
    const modelPath = path.join(__dirname, 'resources', 'ggml-medium.bin');
>>>>>>> 5cc4e76 (Committing the first set of resutls.)
    
    // DEBUGGING - Log everything
    console.log('=== WHISPER DEBUG ===');
    console.log('Temp audio path:', tempPath);
    console.log('Temp audio exists:', fs.existsSync(tempPath));
    console.log('Temp audio size:', fs.statSync(tempPath).size, 'bytes');
    console.log('Whisper path:', whisperPath);
    console.log('Whisper exists:', fs.existsSync(whisperPath));
    console.log('Model path:', modelPath);
    console.log('Model exists:', fs.existsSync(modelPath));
    console.log('====================');
    
    // Spawn whisper process
    const whisper = spawn(whisperPath, [
      '-m', modelPath,
      '-f', tempPath,
      '-t', '8',
      '-l', 'en',
      '--no-timestamps'
    ]);
    
    let output = '';
    let errors = '';
    
    whisper.stdout.on('data', data => {
      console.log('STDOUT:', data.toString());
      output += data.toString();
    });
    
    whisper.stderr.on('data', data => {
      console.log('STDERR:', data.toString());
      errors += data.toString();
    });
    
    whisper.on('error', (error) => {
      console.log('SPAWN ERROR:', error);
      fs.unlinkSync(tempPath);
      reject(new Error(`Failed to spawn whisper: ${error.message}`));
    });
    
    whisper.on('close', code => {
      console.log('Exit code:', code);
      console.log('Full stderr output:', errors);
      console.log('Full stdout output:', output);
      
      fs.unlinkSync(tempPath); // Clean up temp file
      
      if (code === 0) {
        // Extract transcription
        const text = output
          .split('\n')
          .filter(line => line.trim() && !line.includes('['))
          .join(' ')
          .trim();
        resolve(text);
      } else {
        reject(new Error(`Whisper exited with code ${code}: ${errors}`));
      }
    });
  });
});
