import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import icon from '../../resources/icon.svg?asset'

function createWindow() {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1080,
    height: 820,
    show: false,
    useContentSize: true,
    titleBarOverlay: {
      color: 'rgba(255, 255, 255, 0.014)',
      symbolColor: '#db891e'
    },
    titleBarStyle: 'hidden',
    icon: icon,
    ...(process.platform === 'linux'
      ? {
          icon
        }
      : {}),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return {
      action: 'deny'
    }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  var fs = require('node:fs')
  var path = require('path')
  var os = require('os')
  var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
  var ffmpeg = require('fluent-ffmpeg')
  ffmpeg.setFfmpegPath(ffmpegPath)
  const basePath = path.join(os.homedir(), 'Desktop')

  ipcMain.on('downloadAudio', (event, audios, method) => {
    const voiceOver = audios.voiceover
    const track = audios.track
    const signature = audios.signature

    const outputDir = path.join(basePath, 'spot_radio', 'outputAudio')
    const mergedFile = path.join(outputDir, 'temp.wav')
    const finalOutputFile = path.join(outputDir, `${audios.name}.mp3`)
    if (method === 'concatAndMerge') {
      if (!fs.existsSync(voiceOver) || !fs.existsSync(track) || !fs.existsSync(signature)) {
        console.error('Arquivo não encontrado')
        return
      }

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      ffmpeg()
        .input(voiceOver)
        .input(track)
        .complexFilter(['[0:a]volume=0.5[a1]', '[1:a]volume=0.5[a2]', '[a1][a2]amerge=inputs=2[a]'])
        .outputOptions('-map', '[a]')
        .audioChannels(2)
        .audioCodec('pcm_s16le')
        .save(mergedFile)
        .on('end', () => {
          ffmpeg()
            .input(mergedFile)
            .input(signature)
            .complexFilter('[0:a][1:a]concat=n=2:v=0:a=1[a]')
            .outputOptions('-map', '[a]')
            .audioCodec('libmp3lame')
            .audioChannels(2)
            .audioFrequency(44100)
            .save(finalOutputFile)
            .on('end', () => {
              fs.unlink(mergedFile, (err) => {
                if (err) {
                  return
                }
              })
            })
            .on('error', (err) => {
              console.error('Erro durante a concatenação:', err)
            })
        })
        .on('error', (err) => {
          console.error('Erro durante o merge:', err)
        })
    } else if (method === 'merge') {
      if (!fs.existsSync(voiceOver) || !fs.existsSync(track)) {
        console.error('Arquivo não encontrado')
        return
      }
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      ffmpeg()
        .input(track)
        .input(voiceOver)
        .outputOptions('-ac', '2')
        .complexFilter(['[0:a]volume=0.3[a1]', '[1:a]volume=0.5[a2]', '[a2][a1]amerge=inputs=2[a]'])
        .audioFrequency(22050)
        .audioChannels(2)
        .audioQuality(1)
        .audioCodec('libmp3lame')
        .outputOptions('-map', '[a]')
        .save(finalOutputFile)
        .on('end', () => {
          console.log('Conversion finished')
        })
        .on('error', (err) => {
          console.error('Error:', err)
        })
    } else if (method === 'concat') {
      if (!fs.existsSync(voiceOver) || !fs.existsSync(signature)) {
        console.error('Arquivo não encontrado')
        return
      }
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }

      ffmpeg()
        .input(voiceOver)
        .input(signature)
        .complexFilter('[0:a][1:a]concat=n=2:v=0:a=1[a]')
        .outputOptions('-map', '[a]')
        .audioCodec('libmp3lame')
        .audioChannels(2)
        .audioFrequency(44100)
        .save(finalOutputFile)
        .on('end', () => {
          console.log(`Arquivo concatenado salvo em ${finalOutputFile}`)
        })
        .on('error', (err, stdout, stderr) => {
          console.error('ffmpeg stderr:', stderr)
          console.error('Erro durante a concatenação:', err)
        })
    } else {
      return
    }
  })

  ipcMain.on('syncVoiceover', async (event, voiceover) => {
    const buffer = Buffer.from(voiceover.b64, 'base64')
    const filePath = path.join(basePath, 'spot_radio', 'temp', `${voiceover.name}.mp3`)
    fs.writeFile(filePath, buffer, (err) => {
      if (err) {
        console.error('Error writing the file', err)
      } else {
        console.log('Arquivo criado')
      }
    })
    return event.sender.send('syncVoiceoverResponse', {
      success: true,
      data: filePath
    })
  })

  ipcMain.on('deleteTempAudio', (event, voiceOverPath) => {
    try {
      fs.unlinkSync(voiceOverPath)
    } catch (err) {
      console.error(err)
    }
  })

  ipcMain.on('createPaths', () => {
    try {
      const outputDir = path.join(basePath, 'spot_radio', 'outputAudio')
      const tempDir = path.join(basePath, 'spot_radio', 'temp')
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }
    } catch (e) {
      console.log(e)
    }
  })

  // const deleteTempPath = () => {
  //   const tempDir = path.join(basePath, 'spot_radio', 'temp')
  //   try {
  //     fs.unlinkSync(tempDir)
  //   } catch (err) {
  //     console.error(err)
  //   }
  // }

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app"s specific main process
// code. You can also put them in separate files and require them here.
