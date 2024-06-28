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
      nodeIntegration: true,
      webSecurity: false,
      enableRemoteModule: true,
      enableWebSQL: false,
      enableServiceWorker: true,
      experimentalFeatures: true,
      webviewTag: true
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
  // var ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
  // var ffmpegPath = require('ffmpeg-static')
  // var ffmpegPath = path.join(process.resourcesPath, 'ffmpeg.exe')
  const ffmpegPath = require('ffmpeg-static')
  console.log(ffmpegPath)
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
      if (audios.extend === false) {
        ffmpeg()
          .input(track)
          .input(voiceOver)
          .complexFilter([
            '[0:a]volume=0.7,aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a1]',
            '[1:a]volume=1.0,aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a2]',
            '[a1][a2]amerge=inputs=2[a]'
          ])
          .outputOptions('-map', '[a]')
          .audioCodec('pcm_s16le')
          .output(mergedFile)
          .on('end', () => {
            ffmpeg()
              .input(mergedFile)
              .input(signature)
              .complexFilter('[0:a][1:a]concat=n=2:v=0:a=1[a]')
              .outputOptions('-map', '[a]')
              .audioCodec('libmp3lame')
              .audioChannels(2)
              .audioFrequency(44100)
              .audioBitrate('320k')
              .output(finalOutputFile)
              .on('end', () => {
                fs.unlink(mergedFile, (err) => {
                  if (err) {
                    console.error('Error deleting intermediate file:', err)
                  } else {
                    console.log('Intermediate file deleted successfully.')
                  }
                })
              })
              .on('error', (err) => {
                console.error('Error during concatenation:', err)
              })
              .run()
          })
          .on('error', (err) => {
            console.error('Error during merging:', err)
          })
          .run()
      } else {
        ffmpeg()
          .input(voiceOver)
          .input(signature)
          .complexFilter('[0:a][1:a]concat=n=2:v=0:a=1[a]')
          .outputOptions('-map', '[a]')
          .audioCodec('pcm_s16le')
          .audioChannels(2)
          .save(mergedFile)
          .on('end', () => {
            ffmpeg()
              .input(mergedFile)
              .input(track)
              .complexFilter([
                '[0:a]aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a1]',
                '[1:a]aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a2]',
                '[a1][a2]amerge=inputs=2[a]'
              ])
              .outputOptions('-map', '[a]')
              .audioCodec('libmp3lame')
              .audioChannels(2)
              .audioFrequency(44100)
              .audioBitrate('320k')
              .save(finalOutputFile)
              .on('end', () => {
                fs.unlink(mergedFile, (err) => {
                  if (err) {
                    console.error('Erro ao deletar o arquivo intermediário:', err)
                    return
                  }
                })
              })
              .on('error', (err) => {
                console.error('Erro durante a fusão:', err)
              })
          })
          .on('error', (err) => {
            console.error('Erro durante a concatenação:', err)
          })
      }
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
        .complexFilter([
          '[0:a]aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a0]',
          '[1:a]aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a1]',
          '[a0][a1]amerge=inputs=2[a]'
        ])
        .audioCodec('libmp3lame')
        .audioChannels(2)
        .outputOptions('-ac', '2')
        .outputOptions('-map', '[a]')
        .save(finalOutputFile)
        .on('end', () => {
          console.log('Conversion finished')
        })
        .on('error', (err, stdout, stderr) => {
          console.error('Error:', err)
          console.error('ffmpeg stderr:', stderr)
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
      return
    } else {
      return
    }
  })

  ipcMain.on('unsyncPlayAudio', (event, filePath) => {
    try {
      fs.unlinkSync(filePath)
    } catch (err) {
      console.error(err)
    }
  })

  ipcMain.on('playAudio', (event, audios, method) => {
    const voiceOver = audios.voiceover
    const track = audios.track
    const signature = audios.signature
    const outputDir = path.join(basePath, 'spot_radio', 'temp')
    const mergedFile = path.join(outputDir, 'temp.wav')
    // const finalOutputFile = path.join(outputDir, 'play_' + audios.name + '.mp3')
    const finalOutputFile = audios.play
    if (method === 'concatAndMerge') {
      if (!fs.existsSync(voiceOver)) {
        console.error(`${voiceOver} Não existe!.`)
        return voiceOver
      } else if (!fs.existsSync(track)) {
        console.error(`${track} Não existe!`)
        return track
      } else if (!fs.existsSync(signature)) {
        console.error(`${signature} Não existe!`)
        return signature
      }

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      if (audios.extend === false) {
        ffmpeg()
          .input(track)
          .input(voiceOver)
          .complexFilter([
            '[0:a]volume=0.7,aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a1]',
            '[1:a]volume=1.0,aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a2]',
            '[a1][a2]amerge=inputs=2[a]'
          ])
          .outputOptions('-map', '[a]')
          .audioCodec('pcm_s16le')
          .output(mergedFile)
          .on('end', () => {
            console.log('Merging completed successfully.')

            ffmpeg()
              .input(mergedFile)
              .input(signature)
              .complexFilter('[0:a][1:a]concat=n=2:v=0:a=1[a]')
              .outputOptions('-map', '[a]')
              .audioCodec('libmp3lame')
              .audioChannels(2)
              .audioFrequency(44100)
              .audioBitrate('320k')
              .output(finalOutputFile)
              .on('end', () => {
                console.log('Concatenation completed successfully.')

                fs.unlink(mergedFile, (err) => {
                  if (err) {
                    console.error('Error deleting intermediate file:', err)
                  } else {
                    console.log('Intermediate file deleted successfully.')
                  }
                })
              })
              .on('error', (err) => {
                console.error('Error during concatenation:', err)
              })
              .run()
          })
          .on('error', (err) => {
            console.error('Error during merging:', err)
          })
          .run()
      } else {
        ffmpeg()
          .input(voiceOver)
          .input(signature)
          .complexFilter('[0:a][1:a]concat=n=2:v=0:a=1[a]')
          .outputOptions('-map', '[a]')
          .audioCodec('pcm_s16le')
          .audioChannels(2)
          .save(mergedFile)
          .on('end', () => {
            ffmpeg()
              .input(mergedFile)
              .input(track)
              .complexFilter([
                '[0:a]aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a1]',
                '[1:a]aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a2]',
                '[a1][a2]amerge=inputs=2[a]'
              ])
              .outputOptions('-map', '[a]')
              .audioCodec('libmp3lame')
              .audioChannels(2)
              .audioFrequency(44100)
              .audioBitrate('320k')
              .save(finalOutputFile)
              .on('end', () => {
                fs.unlink(mergedFile, (err) => {
                  if (err) {
                    console.error('Erro ao deletar o arquivo intermediário:', err)
                    return
                  }
                })
              })
              .on('error', (err) => {
                console.error('Erro durante a fusão:', err)
              })
          })
          .on('error', (err) => {
            console.error('Erro durante a concatenação:', err)
          })
      }
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
        .complexFilter([
          '[0:a]aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a0]',
          '[1:a]aresample=44100,aformat=sample_fmts=s16:channel_layouts=stereo[a1]',
          '[a0][a1]amerge=inputs=2[a]'
        ])
        .audioCodec('libmp3lame')
        .audioChannels(2)
        .outputOptions('-ac', '2')
        .outputOptions('-map', '[a]')
        .save(finalOutputFile)
        .on('end', () => {
          console.log('Conversion finished')
        })
        .on('error', (err, stdout, stderr) => {
          console.error('Error:', err)
          console.error('ffmpeg stderr:', stderr)
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
      return
    } else {
      return
    }
  })

  ipcMain.on('getAudioPath', (event) => {
    const tempDir = path.join(basePath, 'spot_radio', 'temp')
    return event.sender.send('getAudioPathResponse', {
      success: true,
      data: tempDir
    })
  })

  ipcMain.on('syncVoiceover', async (event, voiceover) => {
    const buffer = Buffer.from(voiceover.b64, 'base64')
    const filePath = path.join(basePath, 'spot_radio', 'temp', `${voiceover.name}.mp3`)

    // const name

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
      let track = path.join(basePath, 'spot_radio', 'meus arquivos', 'trilhas')
      let signature = path.join(basePath, 'spot_radio', 'meus arquivos', 'assinatura')

      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true })
      }
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true })
      }

      if (!fs.existsSync(track)) {
        fs.mkdirSync(track, { recursive: true })
      }

      if (!fs.existsSync(signature)) {
        fs.mkdirSync(signature, { recursive: true })
      }
    } catch (e) {
      console.log(e)
    }
  })

  ipcMain.on('validatePaths', (event, filesPath) => {
    let tracksPath = path.join(basePath, 'spot_radio', 'meus arquivos', 'trilhas')
    let signaturesPath = path.join(basePath, 'spot_radio', 'meus arquivos', 'assinatura')

    let trackFiles = fs.readdirSync(tracksPath)
    console.log(trackFiles)
    let signatureFiles = fs.readdirSync(signaturesPath)
    console.log(signatureFiles)
    console.log(filesPath)
    for (let i in filesPath) {
      const filterTrack = trackFiles.some((track) => track === filesPath[i].trilha)
      if (filterTrack === false) {
        alert(
          `${filesPath[i].trilha} não encontrado no diretório. Insira o arquivo na pasta ${tracksPath}`
        )
        return event.sender.send('csvFilesPaths', {
          success: false,
          data: 'error'
        })
      }
      const filterSignature = signatureFiles.some(
        (signature) => signature === filesPath[i].assinatura
      )
      if (filterSignature === false) {
        alert(
          `${filesPath[i].assinatura} não encontrado no diretório. Insira o arquivo na pasta ${signaturesPath}`
        )
        return event.sender.send('csvFilesPaths', {
          success: false,
          data: 'error'
        })
      }
    }

    let filesPathCopy = [...filesPath]
    for (let j in filesPathCopy) {
      filesPathCopy[j].assinatura = join(signaturesPath, filesPathCopy[j].assinatura)
      filesPathCopy[j].trilha = join(tracksPath, filesPathCopy[j].trilha)
    }

    return event.sender.send('csvFilesPaths', {
      success: true,
      data: filesPathCopy
    })
  })
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
