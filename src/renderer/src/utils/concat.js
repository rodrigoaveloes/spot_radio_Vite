const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)
const fs = require('fs')
const path = require('path')

const outputDir = path.join(__dirname, 'outputAudio')
const outputFile = path.join(outputDir, 'converted.wav')

const concatAudio = async () => {
  const inputFileDir1Voice = path.join(__dirname, '../assets/ia.mp3')
  const inputFileDir2Trilha = path.join(__dirname, '../assets/trilha.mp3')
  const inputFileDir3Additional = path.join(__dirname, '../assets/additional.mp3')
  const outputDir = path.join(__dirname, 'output')
  const mergedFile = path.join(outputDir, 'merged_temp.wav')
  const finalOutputFile = path.join(outputDir, 'merged_output.wav')

  if (
    !fs.existsSync(inputFileDir1Voice) ||
    !fs.existsSync(inputFileDir2Trilha) ||
    !fs.existsSync(inputFileDir3Additional)
  ) {
    console.error('Arquivo não encontrado')
    return
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  ffmpeg()
    .input(inputFileDir1Voice)
    .input(inputFileDir2Trilha)
    .complexFilter(['[0:a]volume=0.5[a1]', '[1:a]volume=0.5[a2]', '[a1][a2]amerge=inputs=2[a]'])
    .outputOptions('-map', '[a]')
    .audioFrequency(22050)
    .audioChannels(2)
    .audioQuality(1)
    .audioCodec('pcm_s16le')
    .save(mergedFile)
    .on('end', () => {
      ffmpeg()
        .input(mergedFile)
        .input(inputFileDir3Additional)
        .complexFilter(['[0:a][1:a]concat=n=2:v=0:a=1[a]'])
        .outputOptions('-map', '[a]')
        .audioCodec('libmp3lame')
        .audioChannels(2)
        .audioFrequency(22050)
        .save(finalOutputFile)
        .on('end', () => {
          fs.unlinkSync(mergedFile)
        })
        .on('error', (err) => {
          console.error('Erro durante a concatenação:', err)
        })
    })
    .on('error', (err) => {
      console.error('Erro durante o merge:', err)
    })
}

module.exports = { concatAudio }
