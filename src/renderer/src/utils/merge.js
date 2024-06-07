const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path
const ffmpeg = require('fluent-ffmpeg')
ffmpeg.setFfmpegPath(ffmpegPath)
const fs = require('fs')
import path from 'path'

const outputDir = './outputAudio'
const outputFile = `${outputDir}/converted.wav`

export const mergeAudio = () => {
  const inputFileDir1Voice = './ia.mp3'
  const inputFileDir2Trilha = './trilha.mp3'
  const outputDir = './output'
  const outputFile = path.join(outputDir, 'merged_output.wav')
  if (!fs.existsSync(inputFileDir1Voice) || !fs.existsSync(inputFileDir2Trilha)) {
    console.error('Input files not found')
    return
  }

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  ffmpeg()
    .input(inputFileDir2Trilha)
    .input(inputFileDir1Voice)
    .outputOptions('-ac', '2')
    .complexFilter(['[0:a]volume=0.3[a1]', '[1:a]volume=0.5[a2]', '[a2][a1]amerge=inputs=2[a]'])
    .audioFrequency(22050)
    .audioChannels(2)
    .audioQuality(1)
    .audioCodec('libmp3lame')
    .outputOptions('-map', '[a]')
    .save(outputFile)
    .on('end', () => {
      console.log('Conversion finished')
    })
    .on('error', (err) => {
      console.error('Error:', err)
    })
  return outputFile
}
