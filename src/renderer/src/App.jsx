import { useEffect, useState } from 'react'
import './App.css'
import './index.css'
import Papa from 'papaparse'
import 'react-h5-audio-player/lib/styles.css'
import { Player } from './components/audioPlayer/audioPlayer'
import { TextToSpeech } from './components/textToSpeech/TextToSpeech'

function App() {
  const ipcHandle = () => window.electron.ipcRenderer.send('ping')
  const [audioLine, setAudioLine] = useState([
    {
      voiceover: 'Locução',
      track: 'Trilha',
      signature: 'Assinatura'
    }
  ])

  const [files, setFiles] = useState({
    tracks: [{ name: '', track: '', voiceover: '', voiceoverText: '', signature: '' }]
  })
  console.log(files)
  function onFileUpload(event) {
    event.preventDefault()
    let id = event.target.id.split('-')
    let type = id[0]
    let index = id[1]

    let file_reader = new FileReader()
    let file = event.target.files[0]
    let tracksCopy = { ...files }

    let audioLineCopy = [...audioLine]
    file_reader.onload = () => {
      if (type == 'signature') {
        audioLineCopy[index].signature = file.name
        setAudioLine(audioLineCopy)
        tracksCopy.tracks[index].signature = file_reader.result
      } else {
        audioLineCopy[index].track = file.name
        setAudioLine(audioLineCopy)
        tracksCopy.tracks[index].track = file_reader.result
      }
      setFiles(tracksCopy)
    }
    file_reader.readAsDataURL(file)
  }

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
      name: '',
      track: '',
      voiceover: '',
      voiceoverText: '',
      signature: ''
    }
    let filesCopy = { ...files }
    filesCopy.tracks.push(track)
    setFiles(filesCopy)
  }

  function deleteLine(index) {
    if (files.tracks.length > 1) {
      let audioLineCopy = [...audioLine]
      let filesCopy = { ...files }
      filesCopy.tracks.splice(index, 1)
      audioLineCopy.splice(index, 1)
      setFiles(filesCopy)
      setAudioLine(audioLineCopy)
    } else {
      setFiles({
        tracks: [
          {
            name: '',
            track: '',
            voiceover: '',
            voiceoverText: '',
            signature: ''
          }
        ]
      })
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
        console.error('Erro ao analisar o arquivo CSV:', error)
        alert('Ocorreu um erro ao analisar o arquivo CSV.')
      }
    })
  }

  const insertCsvData = () => {
    let audioLineCopy = [...audioLine]
    let filesCopy = { ...files }

    for (let i in csvData) {
      let newAudioLine = {
        voiceover: csvData[i].nome,
        voiceoverText: csvData[i].loucao_texto,
        track: 'Trilha',
        signature: 'Assinatura'
      }
      audioLineCopy.push(newAudioLine)

      let newTrack = {
        name: csvData[i].nome,
        voiceoverText: csvData[i].loucao_texto,
        track: '',
        voiceover: '',
        signature: ''
      }
      filesCopy.tracks.push(newTrack)
    }
    setAudioLine(audioLineCopy)
    setFiles(filesCopy)
  }

  useEffect(() => {
    if (csvData.length > 0) {
      insertCsvData()
    }
  }, [csvData])
  return (
    <>
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
          style={{
            borderRadius: '5px',
            width: '140px',
            height: '40px',
            color: 'white',
            backgroundColor: '#000',
            display: 'flex',
            padding: '6px 12px'
          }}
        >
          Subir CSV
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="24px"
            viewBox="0 -960 960 960"
            width="24px"
            fill="#fff"
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
          style={{
            borderRadius: '5px',
            width: '140px',
            height: '40px',
            display: 'flex',
            padding: '6px 12px'
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
              fill="#5f6368"
            >
              <path d="M440-440H200v-80h240v-240h80v240h240v80H520v240h-80v-240Z" />
            </svg>
          </span>
        </button>
      </div>
      <div
        style={{
          display: 'block',
          boxShadow: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
          height: '600px',
          minWidth: '780px',
          overflow: 'auto'
        }}
      >
        <button style={{ margin: '30px' }}>
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
        {audioLine.map((line, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              margin: '10px 3px'
            }}
          >
            <button
              onClick={() => {
                deleteLine(index)
              }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                height="20px"
                viewBox="0 -960 960 960"
                width="20px"
                fill="#000"
              >
                <path d="M312-144q-29.7 0-50.85-21.15Q240-186.3 240-216v-480h-48v-72h192v-48h192v48h192v72h-48v479.57Q720-186 698.85-165T648-144H312Zm336-552H312v480h336v-480ZM384-288h72v-336h-72v336Zm120 0h72v-336h-72v336ZM312-696v480-480Z" />
              </svg>
            </button>

            <div>
              <button
                onClick={() => document.getElementById(`soundTrack-` + index).click()}
                style={{
                  borderRadius: '5px',
                  width: '200px',
                  height: '50px',
                  color: 'white',
                  backgroundColor: '#000',
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
            <hr style={{ border: '1px solid red !important' }} />
            <TextToSpeech name={line.voiceover} index={index} />
            <hr />

            <div>
              <button
                onClick={() => document.getElementById(`signature-` + index).click()}
                style={{
                  borderRadius: '5px',
                  width: '200px',
                  height: '50px',
                  color: 'white',
                  backgroundColor: '#000',
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
            <Player path="../src/assets/Assai_spot.mp3" />
          </div>
        ))}
      </div>
    </>
  )
}

export default App
