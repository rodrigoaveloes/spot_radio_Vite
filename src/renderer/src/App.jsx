import { useEffect, useState } from 'react'
import './App.css'
import './index.css'
import Papa from 'papaparse'
import 'react-h5-audio-player/lib/styles.css'
import { Player } from './components/audioPlayer/audioPlayer'
import { TextToSpeech } from './components/textToSpeech/TextToSpeech'
import { v4 as uuidv4 } from 'uuid'
import { Loading } from './utils/loading'
import { Api } from './api/Api'

function App() {
  const [audioLine, setAudioLine] = useState([
    {
      voiceover: 'Locução',
      voiceoverText: '',
      track: 'Trilha',
      signature: 'Assinatura'
    }
  ])
  const [loading, setLoading] = useState(false)

  const [files, setFiles] = useState({
    tracks: [
      {
        extend: true
      }
    ]
  })

  // inputs audio file
  function onFileUpload(event) {
    event.preventDefault()
    let id = event.target.id.split('-')
    let type = id[0]
    let index = id[1]
    let file = event.target.files[0]
    let tracksCopy = { ...files }
    let audioLineCopy = [...audioLine]
    if (type == 'signature') {
      audioLineCopy[index].signature = file.name
      setAudioLine(audioLineCopy)
      tracksCopy.tracks[index].signature = file.path
    } else {
      audioLineCopy[index].track = file.name
      setAudioLine(audioLineCopy)
      tracksCopy.tracks[index].track = file.path
    }
    setFiles(tracksCopy)
    createPlayTempPath(index)
  }

  // handle extend track or not
  const setExtend = (checkedStatus, index) => {
    let filesCopy = { ...files }
    let audioLineCopy = [...audioLine]
    audioLineCopy[index].extend = checkedStatus
    filesCopy.tracks[index].extend = checkedStatus
    setFiles(filesCopy)
    setAudioLine(audioLineCopy)
    createPlayTempPath(index)
    return
  }

  const getTtsData = async (data) => {
    console.log(files.tracks[data.index])
    data.name = data.name + '_' + data.voice + '_' + uuidv4()
    let sync = await syncVoiceOver(data, files.tracks[data.index])

    // update audioline
    let audiolineCopy = [...audioLine]
    audiolineCopy[data.index].voiceover = data.name
    setAudioLine(audiolineCopy)

    // update files voiceover
    let filesCopy = { ...files }
    filesCopy.tracks[data.index].voiceover = sync.data
    // filesCopy.tracks[data.index].play = sync.path
    filesCopy.tracks[data.index].voiceoverText = data.text
    filesCopy.tracks[data.index].name = data.name
    setFiles(filesCopy)
    createPlayTempPath(data.index)
  }
  // sync voiceover local
  const syncVoiceOver = async (voiceover, files) => {
    return new Promise((resolve, reject) => {
      window.electron.ipcRenderer.send('syncVoiceover', voiceover, files)
      window.electron.ipcRenderer.once('syncVoiceoverResponse', (event, response) => {
        if (response.success) {
          // setFiles
          resolve(response)
        } else {
          console.error('Falha na sincronização:', response.error)
          reject(response.error)
        }
      })
    })
  }

  // CSV
  // transform csv in json
  // update json with csv data
  const [csvData, setCsvData] = useState([])
  const csvUploadFn = (event) => {
    const file = event.target.files[0]
    const fileType = file.name.split('.').pop().toLowerCase()
    if (fileType !== 'csv') {
      alert('Por favor insira um arquiv CSV.')
      return
    }
    Papa.parse(file, {
      header: true,
      complete: (result) => {
        setCsvData(result.data)
      },
      error: (error) => {
        console.log('aqui')
        console.error('Erro ao analisar o arquivo CSV:', error)
        alert('Ocorreu um erro ao analisar o arquivo CSV.')
      }
    })
  }
  // helper than verify if file exists on folder
  async function validatePaths(csvData) {
    const validate = async (csv) => {
      return new Promise((resolve, reject) => {
        window.electron.ipcRenderer.send('validatePaths', csv)
        window.electron.ipcRenderer.once('csvFilesPaths', (event, response) => {
          if (response.success) {
            resolve(response)
          } else {
            console.error('Falha na sincronização:', response.error)
            reject(response.error)
          }
        })
      })
    }
    let result = await validate(csvData)
    return result
  }

  // helper function that´s sync voiceOver from csv files
  async function syncCsvFiles(csvData) {
    const voices = [
      'Adam',
      'Assaí',
      'Assai_Assinatura',
      'Daniel',
      'Diego',
      'Rachel',
      'Sarah',
      'Tim_Mion'
    ]
    const checkVoice = (voicePerson) => {
      for (let i in voices) {
        if (voices[i].toLowerCase() == voicePerson.toLowerCase()) {
          return voices[i]
        }
      }
      return voices[0]
    }
    let body = { text: csvData.loucao_texto, voice: checkVoice(csvData.voz) }
    let response = await Api.TextToSpeech(body)
    console.log(response)
    let b64 = 'data:audio/mpeg;base64,' + response.audioBase64
    let name = (csvData.nome_locucao = csvData.nome_locucao + '_' + csvData.voz + '_' + uuidv4())
    let syncParams = {
      b64: b64,
      name: name,
      text: csvData.loucao_texto,
      voice: csvData.voz
    }
    let voiceOverPath = await syncVoiceOver(syncParams)

    return voiceOverPath
  }

  //sync csv data, download files,
  const insertCsvData = async () => {
    let audioLineCopy = [...audioLine]
    let filesCopy = { ...files }

    for (let i in csvData) {
      if (csvData[i].assinatura === undefined || csvData[i].assinatura === '') {
        setCsvData([])
        i = i + 1
        return alert(`preencha o campo assinatura, na linha ${i}`)
      }
      if (csvData[i].loucao_texto === undefined || csvData[i].loucao_texto === '') {
        setCsvData([])
        i = i + 1
        return alert(`preencha o campo locucao_texto, na linha ${i}`)
      }
      if (csvData[i].nome_locucao === undefined || csvData[i].nome_locucao === '') {
        setCsvData([])
        i = i + 1
        return alert(`preencha o campo nome_locucao, na linha ${i}`)
      }
      if (csvData[i].trilha === undefined || csvData[i].trilha === '') {
        setCsvData([])
        i = i + 1
        return alert(`preencha o campo trilha, na linha ${i}`)
      }

      if (csvData[i].voz === undefined || csvData[i].voz === '') {
        setCsvData([])
        i = i + 1
        return alert(`preencha o campo nome_locucao, na linha ${i}`)
      }
    }

    // verify if files exist
    let csvWithPaths = await validatePaths(csvData)
    setLoading(true)

    const isExtend = (booleanString) => {
      return (booleanString.toLowerCase() === 'não') | (booleanString.toLowerCase() === 'nao')
        ? false
        : true
    }
    function delay(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms))
    }
    try {
      for (let i in csvData) {
        let voiceOverPath = await syncCsvFiles(csvData[i])
        console.log(voiceOverPath)
        let mp3filename = voiceOverPath.data.split('\\').pop().split('.mp3')[0]
        let newAudioLine = {
          voiceover: csvData[i].nome_locucao,
          voiceoverText: csvData[i].loucao_texto,
          voice: csvData[i].voz,
          track: csvData[i].trilha,
          signature: csvData[i].assinatura,
          extend: isExtend(csvData[i].estender)
        }
        audioLineCopy.push(newAudioLine)

        let newTrack = {
          name: mp3filename,
          voiceoverText: csvWithPaths.data[i].loucao_texto,
          voice: csvWithPaths.data[i].voz,
          track: csvWithPaths.data[i].trilha,
          voiceover: voiceOverPath.data,
          signature: csvWithPaths.data[i].assinatura,
          extend: isExtend(csvWithPaths.data[i].estender)
        }
        filesCopy.tracks.push(newTrack)
        delay(2000)
      }

      if (filesCopy.tracks[0].voiceover === undefined) {
        filesCopy.tracks.splice(0, 1)
        audioLineCopy.splice(0, 1)
      }
      setAudioLine(audioLineCopy)
      setFiles(filesCopy)
      // update play Paths
      for (let i in filesCopy.tracks) {
        createPlayTempPath(i)
      }
      setCsvData([])
      setLoading(false)
    } catch (e) {
      alert(e)
      console.error('caminho não encontrado')
      setCsvData([])
      setLoading(false)
    }
  }

  // create new Audio Line
  function addNewLine() {
    let audioLineCopy = [...audioLine]
    let newAudioLine = {
      voiceover: 'Locução',
      voiceoverText: '',
      track: 'Trilha',
      signature: 'Assinatura'
    }

    audioLineCopy.push(newAudioLine)
    setAudioLine(audioLineCopy)

    let track = {
      extend: true
    }
    let filesCopy = { ...files }
    filesCopy.tracks.push(track)
    setFiles(filesCopy)
  }
  // download All audio files
  async function downloadAllFiles() {
    const download = (audioline, index) => {
      const { track, signature, voiceover } = audioline
      if (track && signature && voiceover) {
        window.electron.ipcRenderer.send('downloadAudio', audioline, 'concatAndMerge')
      } else if (voiceover && signature) {
        window.electron.ipcRenderer.send('downloadAudio', audioline, 'concat')
      } else if (voiceover && track) {
        window.electron.ipcRenderer.send('downloadAudio', audioline, 'merge')
      } else {
        alert(`Insira locução com ao menos uma trilha ou assinatura na linha ${index + 1}`)
        return
      }
    }
    setLoading(true)

    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

    for (let i = 0; i < files.tracks.length; i++) {
      await download(files.tracks[i], i)
      await delay(3000)
    }
    setLoading(false)

    alert('arquivo salvo em spot_radio/outputAudio')
  }
  // download single file
  const downloadAudio = (audioline) => {
    if (
      audioline.track !== undefined &&
      audioline.signature !== undefined &&
      audioline.voiceover !== undefined
    ) {
      window.electron.ipcRenderer.send('downloadAudio', audioline, 'concatAndMerge')
      alert('arquivo salvo em spot_radio/outputAudio')
      return
    } else if ((audioline.voiceover !== undefined) & (audioline.signature !== undefined)) {
      window.electron.ipcRenderer.send('downloadAudio', audioline, 'concat')
      alert('arquivo salvo em spot_radio/outputAudio')
      return
    } else if ((audioline.voiceover !== undefined) & (audioline.track !== undefined)) {
      window.electron.ipcRenderer.send('downloadAudio', audioline, 'merge')
      alert('arquivo salvo em spot_radio/outputAudio')
      return
    } else {
      alert('Insira locução com ao menos uma trilha ou assinatura ')
    }
  }
  // delete Line
  function deleteLine(index) {
    let audioLineCopy = [...audioLine]
    let filesCopy = { ...files }
    if (filesCopy.tracks[index].voiceover !== undefined || '') {
      window.electron.ipcRenderer.send('deleteTempAudio', filesCopy.tracks[index].voiceover)
    }
    if (files.tracks.length > 1) {
      filesCopy.tracks.splice(index, 1)
      audioLineCopy.splice(index, 1)
      setFiles(filesCopy)
      setAudioLine(audioLineCopy)
    } else {
      setFiles({ tracks: [{ extend: true }] })
      setAudioLine([
        {
          voiceover: '',
          track: 'Trilha',
          voiceoverText: '',
          signature: 'Assinatura'
        }
      ])

      return
    }
  }

  // helper function that creates a temporary name with the audios names, hash and characteristics ps: this was created because of a bug when playing audio
  function createPlayTempPath(index) {
    let filesCopy = { ...files }
    let basePath = filesCopy.basePath
    let line = filesCopy.tracks[index]
    let playPath = ''
    if (line.signature !== undefined) {
      playPath += line.signature.split('\\').pop().split('.')[0] + '_'
    }
    if (line.track !== undefined) {
      playPath += line.track.split('\\').pop().split('.')[0] + '_'
    }
    if (line.name !== undefined) {
      playPath += line.name.split('\\').pop().split('.')[0] + '_'
    }
    playPath += line.extend ? 'ext.mp3' : 'nExt.mp3'
    let output = basePath + '\\' + playPath
    filesCopy.tracks[index].play = output
    setFiles(filesCopy)
    return
  }

  useEffect(() => {
    if (csvData.length > 0) {
      insertCsvData()
    }
  }, [csvData])

  // create folders if necessary, and take the OS path when starting the application
  const getSrcPath = async () => {
    return new Promise((resolve, reject) => {
      window.electron.ipcRenderer.send('getAudioPath')
      window.electron.ipcRenderer.once('getAudioPathResponse', (event, response) => {
        if (response.success) {
          let copyFiles = { ...files }
          copyFiles.basePath = response.data
          setFiles(copyFiles)
          // alert(response.data)
          resolve(response.data)
        } else {
          console.error('Falha na sincronização:', response.error)
          reject(response.error)
        }
      })
    })
  }
  const createPaths = () => {
    window.electron.ipcRenderer.send('createPaths')
  }
  useEffect(() => {
    createPaths()
    getSrcPath()
  }, [])

  return (
    <>
      <Loading setLoading={loading} />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: '10px',
          paddingTop: '30px'
        }}
      >
        <button
          onClick={() => document.getElementById('file-upload').click()}
          className="light-button2"
          style={{
            fontWeight: 'normal',
            width: '140px',
            height: '40px',
            color: '#dcdbd6',
            display: 'inline-flex',
            justifyContent: 'space-evenly',
            padding: '6px 12px'
          }}
        >
          Subir CSV
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="18px"
            fill="#dcdbd6"
          >
            <path d="M440-200h80v-167l64 64 56-57-160-160-160 160 57 56 63-63v167ZM240-80q-33 0-56.5-23.5T160-160v-640q0-33 23.5-56.5T240-880h320l240 240v480q0 33-23.5 56.5T720-80H240Zm280-520v-200H240v640h480v-440H520ZM240-800v200-200 640-640Z" />
          </svg>
        </button>

        <input
          id="file-upload"
          style={{ display: 'none' }}
          type="file"
          onChange={csvUploadFn}
          accept=".csv"
        />
        <button
          className="light-button"
          style={{
            borderRadius: '5px',
            width: '140px',
            height: '40px',
            display: 'inline-flex',
            padding: '6px 12px',
            color: '#23252a',
            justifyContent: 'space-evenly'
          }}
          onClick={() => {
            addNewLine()
          }}
        >
          <span style={{ display: 'flex' }}>
            Adicionar{' '}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="24px"
              viewBox="0 -960 960 960"
              width="24px"
              fill="#3e4047"
            >
              <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
            </svg>
          </span>
        </button>
      </div>
      <div
        style={{
          display: 'block',
          height: '600px',
          minWidth: '780px',
          overflow: 'auto',
          backgroundColor: '#000',
          borderRadius: '10px',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex' }}>
          <button
            className="light-button"
            onClick={() => {
              downloadAllFiles()
            }}
            style={{ display: 'inline-flex', margin: ' 30px 10px' }}
          >
            Baixar arquivos
            <svg
              xmlns="http://www.w3.org/2000/svg"
              height="20px"
              viewBox="0 -960 960 960"
              width="20px"
              fill="#000"
            >
              <path d="M480-336 288-528l51-51 105 105v-342h72v342l105-105 51 51-192 192ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72h432v-72h72v72q0 29.7-21.16 50.85Q725.68-192 695.96-192H263.72Z" />
            </svg>
          </button>
        </div>

        {audioLine.map((line, index) => (
          <div className="audioLine" key={index}>
            <button
              className="dark-button"
              style={{ backgroundColor: '#3333' }}
              onClick={() => {
                deleteLine(index)
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                fill="#fff"
              >
                <path d="M312-144q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480ZM384-288h72v-336h-72v336Zm120 0h72v-336h-72v336ZM312-696v480-480Z" />
              </svg>
            </button>
            <div>
              <button
                className="dark-button"
                onClick={() => document.getElementById(`soundTrack-` + index).click()}
                style={{
                  borderRadius: '5px',
                  width: '200px',
                  height: '50px',
                  color: '#dcdbd6',
                  backgroundColor: '#3333',
                  display: 'inline-block',
                  padding: '6px 12px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  textAlign: 'left'
                }}
              >
                {line.track}
              </button>
              <input
                id={`soundTrack-` + index}
                style={{ display: 'none' }}
                type="file"
                accept="audio/mp3,audio/wav"
                onChange={onFileUpload}
              />
            </div>
            <TextToSpeech
              text={line.voiceoverText !== undefined ? line.voiceoverText : ''}
              voice={line.voice !== undefined ? line.voice : ''}
              name={line.voiceover}
              index={index}
              onSubmit={getTtsData}
            />
            <div>
              <button
                className="dark-button"
                onClick={() => document.getElementById(`signature-` + index).click()}
                style={{
                  borderRadius: '5px',
                  width: '200px',
                  height: '50px',
                  color: '#dcdbd6',
                  backgroundColor: '#3333',
                  display: 'inline-block',
                  padding: '6px 12px',
                  overflow: 'hidden',
                  whiteSpace: 'nowrap',
                  textOverflow: 'ellipsis',
                  textAlign: 'left'
                }}
              >
                {line.signature}
              </button>
              <input
                id={`signature-` + index}
                style={{ display: 'none' }}
                type="file"
                accept="audio/mp3,audio/wav"
                onChange={onFileUpload}
              />
            </div>

            <Player files={files.tracks[index]} />
            <button
              className="light-button"
              onClick={() => {
                downloadAudio(files.tracks[index])
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                fill="#2b2b2b"
              >
                <path d="M480-336 288-528l51-51 105 105v-342h72v342l105-105 51 51-192 192ZM263.72-192Q234-192 213-213.15T192-264v-72h72v72h432v-72h72v72q0 29.7-21.16 50.85Q725.68-192 695.96-192H263.72Z" />
              </svg>
            </button>
            <div style={{ display: 'flex', margin: ' auto 10px' }}>
              <p>Est.</p>
              <input
                type="checkbox"
                checked={files.tracks[index].extend}
                onChange={(e) => {
                  setExtend(e.target.checked, index)
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </>
  )
}

export default App
