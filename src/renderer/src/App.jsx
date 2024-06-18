import { useEffect, useState } from 'react'
import './App.css'
import './index.css'
import Papa from 'papaparse'
import 'react-h5-audio-player/lib/styles.css'
import { Player } from './components/audioPlayer/audioPlayer'
import { TextToSpeech } from './components/textToSpeech/TextToSpeech'
import { v4 as uuidv4 } from 'uuid'
import { Loading } from './utils/loading'

function App() {
  // convert audio
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

  // save voiceover on desktop temporary
  const syncVoiceOver = async (voiceover) => {
    return new Promise((resolve, reject) => {
      window.electron.ipcRenderer.send('syncVoiceover', voiceover)
      window.electron.ipcRenderer.once('syncVoiceoverResponse', (event, response) => {
        if (response.success) {
          resolve(response.data)
        } else {
          console.error('Falha na sincronização:', response.error)
          reject(response.error)
        }
      })
    })
  }

  const [audioLine, setAudioLine] = useState([
    {
      voiceover: 'Locução',
      track: 'Trilha',
      signature: 'Assinatura'
    }
  ])

  // line with all base64 audio
  const [files, setFiles] = useState({
    tracks: [
      {
        extend: true
        // name: '',
        // track: '',
        // voiceover: '',
        // voiceoverText: '',
        // signature: '',
        // merge: '',
        // concat: ''
      }
    ]
  })

  // input file
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
  }

  const setExtend = (checkedStatus, index) => {
    let filesCopy = { ...files }
    filesCopy.tracks[index].extend = checkedStatus
    setFiles(filesCopy)
    return
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
      // name: '',
      // track: '',
      // voiceover: '',
      // voiceoverText: '',
      // signature: ''
    }
    let filesCopy = { ...files }
    filesCopy.tracks.push(track)
    setFiles(filesCopy)
  }

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
          voiceover: 'Locução',
          track: 'Trilha',
          voiceoverText: '',
          signature: 'Assinatura'
        }
      ])

      return
    }
  }
  // update json with csv data
  const [csvData, setCsvData] = useState([])
  const insertCsvData = () => {
    let audioLineCopy = [...audioLine]
    let filesCopy = { ...files }
    for (let i in csvData) {
      let newAudioLine = {
        voiceover: csvData[i].nome_trilha,
        voiceoverText: csvData[i].loucao_texto,
        voice: csvData[i].voz,
        track: 'Trilha',
        signature: 'Assinatura'
      }
      audioLineCopy.push(newAudioLine)

      let newTrack = {
        name: csvData[i].nome_trilha,
        voiceoverText: csvData[i].loucao_texto,
        voice: csvData[i].voz,
        track: '',
        voiceover: '',
        signature: ''
      }
      filesCopy.tracks.push(newTrack)
    }
    setAudioLine(audioLineCopy)
    setFiles(filesCopy)
  }

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
        console.error('Erro ao analisar o arquivo CSV:', error)
        alert('Ocorreu um erro ao analisar o arquivo CSV.')
      }
    })
  }

  const getTtsData = async (data) => {
    data.name = data.name + '_' + data.voice + '_' + uuidv4()
    let sync = await syncVoiceOver(data)
    // update audioline
    let audiolineCopy = [...audioLine]
    audiolineCopy[data.index].voiceover = data.name
    setAudioLine(audiolineCopy)

    // update files voiceover
    let filesCopy = { ...files }
    // filesCopy.tracks[data.index].voiceover = data.b64
    filesCopy.tracks[data.index].voiceover = sync
    filesCopy.tracks[data.index].voiceoverText = data.text
    filesCopy.tracks[data.index].name = data.name
  }

  useEffect(() => {
    if (csvData.length > 0) {
      insertCsvData()
    }
  }, [csvData])

  useEffect(() => {
    window.electron.ipcRenderer.send('createPaths')
  }, [])

  return (
    <>
      <Loading />
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
            // backgroundColor: '#dcdbd6',
            // border: '1px solid rgba(255, 255, 255, 0.521)',
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
          // boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
          height: '600px',
          minWidth: '780px',
          overflow: 'auto',
          backgroundColor: '#000',
          borderRadius: '10px',
          padding: '20px'
        }}
      >
        <div style={{ display: 'flex' }}>
          <button className="light-button" style={{ display: 'inline-flex', margin: ' 30px 10px' }}>
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

            <Player path="../src/assets/play.mp3" files={files.tracks[index]} />
            <button className="light-button" onClick={() => downloadAudio(files.tracks[index])}>
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
