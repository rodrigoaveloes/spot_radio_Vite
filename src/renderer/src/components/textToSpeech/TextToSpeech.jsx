import { useState } from 'react'
import './index.css'
import toast, { Toaster } from 'react-hot-toast'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import Modal from '@mui/material/Modal'
import SendIcon from '@mui/icons-material/Send'
import CloseIcon from '@mui/icons-material/Close'
import Button from '@mui/material/Button'
import Menu from '@mui/material/Menu'
import MenuItem from '@mui/material/MenuItem'
import UnfoldMoreIcon from '@mui/icons-material/UnfoldMore'
import { Api } from '../../api/Api'
import { Loading } from '../../utils/loading'

export const TextToSpeech = (props) => {
  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 800,
    zIndex: '999',
    bgcolor: '#323237',
    borderRadius: '15px',
    p: 4,
    transition: 'box-shadow 0.3s ease',
    cursor: 'pointer',
    border: 'transparent',
    '&:focus': {
      outline: 'none'
    }
  }
  const [ttsInput, setTtsInput] = useState({
    // name: props.name === 'Locução' ? '' : props.name,
    name: props.name,
    text: props.text
  })
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)
  const notifyError = (message) => toast.error(message)

  async function onSubmit(event) {
    event.preventDefault()
    if (ttsInput.text.trim().length === 0 || ttsInput.name.trim().length === 0) {
      return notifyError('Por favor, Digite um texto valido')
    }
    setOpen(false)
    let body = {
      text: ttsInput.text,
      voice: voice
    }
    console.log(body)
    setLoading(true)
    let response = await Api.TextToSpeech(body)
    let b64 = 'data:audio/mpeg;base64,' + response.audioBase64
    body.b64 = b64
    body.index = props.index
    body.name = ttsInput.name
    // setTtsInput({ name: '', text: '' })
    setLoading(false)

    props.onSubmit({ ...body })
    if (response === null) {
      handleClose(true)
      setLoading(false)
      return notifyError('houve um erro, tente novamente!')
    }
    setOpen(false)
    setLoading(false)
    return
  }

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

  const [voice, setVoice] = useState(checkVoice(props.voice))
  const [anchorEl, setAnchorEl] = useState(null)
  const openVoiceMenu = Boolean(anchorEl)
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget)
  }
  const handleCloseMenu = () => {
    setAnchorEl(null)
  }
  const handleVoice = (voice) => {
    setVoice(voice)
    handleCloseMenu()
  }

  return (
    <>
      <Loading setLoading={loading} />
      <div>
        <Toaster position="top-center" reverseOrder={false} />
        <button
          style={{
            width: '180px',
            height: '51px',
            background: '#3333',
            color: '#dcdbd6',
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            textAlign: 'left'
          }}
          className="dark-button"
          onClick={handleOpen}
        >
          {props.name === '' ? 'Locução' : props.name}
        </button>

        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <Box className="modal-ai" sx={style}>
            <Typography
              id="modal-modal-title"
              variant="h5"
              component="h2"
              style={{ display: 'flex', justifyContent: 'space-between' }}
            >
              <div style={{ width: '80px', marginTop: '-30px' }}>
                <p
                  style={{
                    fontSize: '15px',
                    fontWeight: 'lighter',
                    color: 'rgba(115, 115, 115, 0.656)'
                  }}
                >
                  Versão Beta
                </p>
              </div>

              <div style={{ width: '80px', marginTop: '-20px' }}>
                <svg xmlns="http://www.w3.org/2000/svg" version="1.0" viewBox="0 0 286 234">
                  <path
                    fill="#BF4080"
                    fillOpacity=".2"
                    d="m85 112.7-10.5 10.8L85.3 113c9.9-9.7 11.2-11 10.4-11-.1 0-5 4.8-10.7 10.7m26.5 8.5-11 11.3 11.3-11c10.4-10.2 11.7-11.5 10.9-11.5-.1 0-5.2 5.1-11.2 11.2M76 142.5c1.9 1.9 3.6 3.5 3.9 3.5s-1-1.6-2.9-3.5-3.6-3.5-3.9-3.5 1 1.6 2.9 3.5"
                  />
                  <path
                    fill="#BF0040"
                    fillOpacity=".4"
                    d="M82.8 58.7c.7.3 1.6.2 1.9-.1.4-.3-.2-.6-1.3-.5-1.1 0-1.4.3-.6.6M71.1 70.6c0 1.1.3 1.4.6.6.3-.7.2-1.6-.1-1.9-.3-.4-.6.2-.5 1.3m96.7 19.1c.7.3 1.6.2 1.9-.1.4-.3-.2-.6-1.3-.5-1.1 0-1.4.3-.6.6M71.2 132c0 1.4.2 1.9.5 1.2.2-.6.2-1.8 0-2.5-.3-.6-.5-.1-.5 1.3"
                  />
                  <path
                    fill="#BF4080"
                    fillOpacity=".3"
                    d="M75 79.5c1.3 1.4 2.6 2.5 2.8 2.5.3 0-.5-1.1-1.8-2.5S73.4 77 73.2 77c-.3 0 .5 1.1 1.8 2.5m82.5 49.7-10 10.3 10.3-10c5.6-5.5 10.2-10.1 10.2-10.2 0-.8-1.2.4-10.5 9.9m-32.4 3.4c0 1.1.3 1.4.6.6.3-.7.2-1.6-.1-1.9-.3-.4-.6.2-.5 1.3m11.7 12.1c.7.3 1.6.2 1.9-.1.4-.3-.2-.6-1.3-.5-1.1 0-1.4.3-.6.6M93 159.2c12.5 12.8 14 14.3 14 13.5 0-.1-6.2-6.3-13.7-13.7l-13.8-13.5z"
                  />
                  <path
                    fill="#BF8080"
                    fillOpacity=".2"
                    d="M126.1 101.6c0 1.1.3 1.4.6.6.3-.7.2-1.6-.1-1.9-.3-.4-.6.2-.5 1.3m85 31c0 1.1.3 1.4.6.6.3-.7.2-1.6-.1-1.9-.3-.4-.6.2-.5 1.3m-85 31c0 1.1.3 1.4.6.6.3-.7.2-1.6-.1-1.9-.3-.4-.6.2-.5 1.3"
                  />
                  <path
                    fill="#BF8080"
                    fillOpacity=".1"
                    d="m143.5 108.2-16 16.3 16.3-16c15-14.8 16.7-16.5 15.9-16.5-.1 0-7.4 7.3-16.2 16.2m40 26.8c3.8 3.8 7.2 7 7.4 7 .3 0-2.6-3.2-6.4-7-3.8-3.9-7.2-7-7.4-7-.3 0 2.6 3.1 6.4 7m-76 4c3.8 3.8 7.2 7 7.4 7 .3 0-2.6-3.2-6.4-7-3.8-3.9-7.2-7-7.4-7-.3 0 2.6 3.1 6.4 7"
                  />
                  <path
                    fill="#BF0040"
                    fillOpacity=".6"
                    d="m86 112.7-10.5 10.8L86.3 113c9.9-9.7 11.2-11 10.4-11-.1 0-5 4.8-10.7 10.7m26 7-9.5 9.8 9.8-9.5c5.3-5.2 9.7-9.6 9.7-9.7 0-.8-1.2.4-10 9.4"
                  />
                  <path
                    fill="#BF0040"
                    fillOpacity=".7"
                    d="M163 122.5c-2.4 2.5-4.2 4.5-3.9 4.5s2.5-2 4.9-4.5 4.2-4.5 3.9-4.5-2.5 2-4.9 4.5m-62.1 8.2c-1.3 1.6-1.2 1.7.4.4.9-.7 1.7-1.5 1.7-1.7 0-.8-.8-.3-2.1 1.3M87.5 153c7.1 7.1 13.2 13 13.5 13 .2 0-5.4-5.9-12.5-13-7.1-7.2-13.2-13-13.5-13-.2 0 5.4 5.8 12.5 13"
                  />
                  <path
                    fill="#BF0040"
                    fillOpacity=".8"
                    d="M74.9 62.7c-1.3 1.6-1.2 1.7.4.4.9-.7 1.7-1.5 1.7-1.7 0-.8-.8-.3-2.1 1.3M106.5 78c8.8 8.8 16.2 16 16.5 16s-6.7-7.2-15.5-16S91.3 62 91 62s6.7 7.2 15.5 16M86 89.5c6.3 6.6 11.7 11.9 12 11.7.2-.1-5-5.5-11.5-12l-12-11.7zm58.5 19.7-17 17.3 17.3-17c9.4-9.3 17.2-17.1 17.2-17.2 0-.8-1.7.9-17.5 16.9m47-.2c8.8 8.8 16.2 16 16.5 16s-6.7-7.2-15.5-16-16.2-16-16.5-16 6.7 7.2 15.5 16M180 129.5c6.3 6.3 11.7 11.5 12 11.5.2 0-4.7-5.2-11-11.5S169.3 118 169 118c-.2 0 4.7 5.2 11 11.5m-28.5 4.7-7 7.3 7.3-7c6.7-6.4 7.7-7.5 6.9-7.5-.1 0-3.4 3.3-7.2 7.2m-25.4-1.6c0 1.1.3 1.4.6.6.3-.7.2-1.6-.1-1.9-.3-.4-.6.2-.5 1.3M111.5 145c6.6 6.6 12.2 12 12.5 12 .2 0-4.9-5.4-11.5-12s-12.2-12-12.5-12c-.2 0 4.9 5.4 11.5 12m25.3-1.3c.7.3 1.6.2 1.9-.1.4-.3-.2-.6-1.3-.5-1.1 0-1.4.3-.6.6m62 0c.7.3 1.6.2 1.9-.1.4-.3-.2-.6-1.3-.5-1.1 0-1.4.3-.6.6M103 168.5c1.3 1.4 2.6 2.5 2.8 2.5.3 0-.5-1.1-1.8-2.5s-2.6-2.5-2.8-2.5c-.3 0 .5 1.1 1.8 2.5"
                  />
                  <path
                    fill="#BF0040"
                    fillOpacity=".9"
                    d="M82.8 59.7c.7.3 1.6.2 1.9-.1.4-.3-.2-.6-1.3-.5-1.1 0-1.4.3-.6.6m6.2 1.7c0 .2.8 1 1.8 1.7 1.5 1.3 1.6 1.2.3-.4S89 60.6 89 61.4m-16.9 9.2c0 1.1.3 1.4.6.6.3-.7.2-1.6-.1-1.9-.3-.4-.6.2-.5 1.3m.9 4.8c0 .2.8 1 1.8 1.7 1.5 1.3 1.6 1.2.3-.4S73 74.6 73 75.4m10 10.1c3.5 3.6 6.7 6.5 6.9 6.5.3 0-2.4-2.9-5.9-6.5S77.3 79 77.1 79c-.3 0 2.4 2.9 5.9 6.5m31 1c3.5 3.6 6.7 6.5 6.9 6.5.3 0-2.4-2.9-5.9-6.5s-6.7-6.5-6.9-6.5c-.3 0 2.4 2.9 5.9 6.5m53.8 4.2c.7.3 1.6.2 1.9-.1.4-.3-.2-.6-1.3-.5-1.1 0-1.4.3-.6.6m18.7 14.3c7.1 7.1 13.2 13 13.5 13 .2 0-5.4-5.9-12.5-13-7.1-7.2-13.2-13-13.5-13-.2 0 5.4 5.8 12.5 13m-101 9c-6.6 6.6-11.7 12-11.5 12 .3 0 5.9-5.4 12.5-12s11.7-12 11.5-12c-.3 0-5.9 5.4-12.5 12m25 6c-6.5 6.5-11.7 12.1-11.5 12.2.3.2 5.9-5.2 12.5-12 6.5-6.7 11.7-12.2 11.4-12.2-.2 0-5.8 5.4-12.4 12m52 2.2-5 5.3 5.5-5c3-2.8 5.7-5.1 5.9-5.3.2-.1 0-.2-.5-.2s-3.2 2.4-5.9 5.2m9-2.2c1 1.1 2 2 2.3 2s-.3-.9-1.3-2-2-2-2.3-2 .3.9 1.3 2m31.5 1.5c1.3 1.4 2.6 2.5 2.8 2.5.3 0-.5-1.1-1.8-2.5s-2.6-2.5-2.8-2.5c-.3 0 .5 1.1 1.8 2.5M72.2 132c0 1.4.2 1.9.5 1.2.2-.6.2-1.8 0-2.5-.3-.6-.5-.1-.5 1.3m79.2 1.2-2.9 3.3 3.3-2.9c3-2.8 3.7-3.6 2.9-3.6-.2 0-1.6 1.5-3.3 3.2M91 155.5c9.6 9.6 17.7 17.5 18 17.5s-7.4-7.9-17-17.5S74.3 138 74 138s7.4 7.9 17 17.5m38.5-15.5c1 1.1 2 2 2.3 2s-.3-.9-1.3-2-2-2-2.3-2 .3.9 1.3 2m14.4.7c-1.3 1.6-1.2 1.7.4.4s2.1-2.1 1.3-2.1c-.2 0-1 .8-1.7 1.7"
                  />
                  <path
                    fill="#BF0040"
                    d="M77.8 61.6c-3.5 1.9-4.8 4.3-4.8 9.1.1 3.5 1.1 4.8 12.5 16.8 6.9 7.1 12.5 13.4 12.5 13.9 0 .6-5.6 6.7-12.5 13.6C73.3 127.3 73 127.8 73 132c0 4.3.2 4.6 18.2 22.7 19.8 19.9 21.8 21.2 27.6 17.8 5.3-3.2 7.5-9.1 5.1-13.8-.6-1.2-6.6-7.7-13.2-14.4L98.6 132l12.6-12.7c12.5-12.7 14.6-15.9 13.4-20.6-.5-2.1-29-31.8-35-36.5-3.3-2.5-7.9-2.8-11.8-.6m69 46.1c-9.3 9.3-17.6 18-18.4 19.5-2.4 4.6-1.8 8.6 2 12.4 2.6 2.6 4.3 3.4 6.9 3.4 4.3 0 6.2-1.5 19.6-15.2 5.8-5.9 10.9-10.8 11.3-10.8.5 0 6 5.4 12.4 11.9 6.3 6.5 12.8 12.4 14.4 13.1 7.7 3.2 16.1-3.4 14.6-11.5-.5-2.5-4.5-7.1-18.1-20.5-9.6-9.5-18-17.7-18.7-18.1-.7-.5-3-.9-5.2-.9-3.7 0-4.7.8-20.8 16.7"
                  />
                  <path
                    fill="#BF4040"
                    fillOpacity=".5"
                    d="m147 105.7-11.5 11.8 11.8-11.5c10.9-10.7 12.2-12 11.4-12-.1 0-5.4 5.3-11.7 11.7m-15.6 15.5-1.9 2.3 2.3-1.9c2.1-1.8 2.7-2.6 1.9-2.6-.2 0-1.2 1-2.3 2.2M114.5 147c3.8 3.8 7.2 7 7.4 7 .3 0-2.6-3.2-6.4-7-3.8-3.9-7.2-7-7.4-7-.3 0 2.6 3.1 6.4 7"
                  />
                  <path
                    fill="#BF4080"
                    fillOpacity=".4"
                    d="M106.5 77c8.2 8.2 15.2 15 15.5 15 .2 0-6.3-6.8-14.5-15-8.2-8.3-15.2-15-15.5-15-.2 0 6.3 6.7 14.5 15M87 91.5c5.2 5.2 9.7 9.5 10 9.5.2 0-3.8-4.3-9-9.5S78.3 82 78 82c-.2 0 3.8 4.3 9 9.5m105 17c8.5 8.5 15.7 15.5 16 15.5s-6.5-7-15-15.5S177.3 93 177 93s6.5 7 15 15.5m-12 22c6.3 6.3 11.7 11.5 12 11.5.2 0-4.7-5.2-11-11.5S169.3 119 169 119c-.2 0 4.7 5.2 11 11.5m-79 2.8c0 .2 1.5 1.6 3.3 3.3l3.2 2.9-2.9-3.3c-2.8-3-3.6-3.7-3.6-2.9m20.9 38.4c-1.3 1.6-1.2 1.7.4.4s2.1-2.1 1.3-2.1c-.2 0-1 .8-1.7 1.7"
                  />
                  <path
                    fill="#BF4040"
                    fillOpacity=".7"
                    d="M125.1 101.6c0 1.1.3 1.4.6.6.3-.7.2-1.6-.1-1.9-.3-.4-.6.2-.5 1.3m0 62c0 1.1.3 1.4.6.6.3-.7.2-1.6-.1-1.9-.3-.4-.6.2-.5 1.3"
                  />
                  <path
                    fill="#BF4080"
                    fillOpacity=".1"
                    d="M118.5 150c2.1 2.2 4.1 4 4.4 4s-1.3-1.8-3.4-4-4.1-4-4.4-4 1.3 1.8 3.4 4"
                  />
                </svg>
              </div>

              <div style={{ width: '80px' }}>
                <button className="btn-close" onClick={handleClose}>
                  <CloseIcon style={{ fill: 'white' }} fontSize="large" />
                </button>
              </div>
            </Typography>

            <div style={{ marginBottom: '40px', color: '#dcdbd6' }}>
              <h3 style={{ textAlign: 'center', fontWeight: '500', color: '#dcdbd6' }}>
                Transforme seus textos em fala
              </h3>

              <ul>
                <li>
                  <h3 style={{ fontWeight: 500, color: '#dcdbd6' }}>Dicas</h3>
                </li>
                <li>
                  <p>
                    {' '}
                    "Você pode adicionar emoção, pausas e quebras na fala usando" "<b>..</b>" (pausa
                    curta), "<b>--</b>" (pausa média), "<b>-</b>" (pausa longa) e{' '}
                    <span style={{ color: '#dcdbd6' }}>
                      <b>&lt;break time="1.5s" /&gt;</b>
                    </span>{' '}
                    (pausa específica de 1,5 segundos).
                  </p>
                </li>
                <li>
                  Para colocar emoções, eu posso usar o texto como em um livro. Exemplo: "Você tem
                  certeza disso?" ele disse, confuso. "Não me teste!" ele gritou com raiva.
                </li>
                <li>
                  <p style={{ color: '#dcdbd6' }}>
                    <b>Exemplo:</b> "Aproveite nossas promoções!{' '}
                    <span style={{ color: '#dcdbd6' }}>
                      <b>&lt;break time="1.5s" /&gt;</b>
                    </span>{' '}
                    Notebook por apenas vinte e uma vezes de cem reais."
                  </p>
                </li>
              </ul>
            </div>
            <form disabled onSubmit={onSubmit} autoComplete="off">
              <div style={{ display: 'flex', margin: '1rem auto' }}>
                <input
                  className="ai-input"
                  style={{ borderRadius: '10px 0px 0px 10px', width: '120px' }}
                  type="text"
                  name="text"
                  value={ttsInput.name}
                  onChange={(e) => setTtsInput({ ...ttsInput, name: e.target.value })}
                  placeholder="Nome da trilha"
                />
                <input
                  className="ai-input"
                  style={{ borderRadius: '0px' }}
                  type="text"
                  name="text"
                  value={ttsInput.text}
                  onChange={(e) => setTtsInput({ ...ttsInput, text: e.target.value })}
                  placeholder="Digite aqui o texto que você deseja converter em fala"
                />

                <div className="voice-menu-options">
                  <Button
                    style={{ marginBottom: '30px', color: 'white' }}
                    id="basic-button"
                    aria-controls={open ? 'basic-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={open ? 'true' : undefined}
                    onClick={handleClick}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        width: '100px',
                        marginTop: '3px',
                        overflow: 'hidden'
                      }}
                    >
                      {voice}
                      <UnfoldMoreIcon style={{ zIndex: '999' }} fontSize="small" />
                    </div>
                  </Button>
                  <Menu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={openVoiceMenu}
                    onClose={handleCloseMenu}
                    MenuListProps={{
                      'aria-labelledby': 'basic-button'
                    }}
                    anchorOrigin={{
                      vertical: 'bottom',
                      horizontal: 'center'
                    }}
                    transformOrigin={{
                      vertical: 'top',
                      horizontal: 'center'
                    }}
                  >
                    {voices.map((voice, index) => (
                      <MenuItem
                        style={{ minWidth: '105px' }}
                        key={index}
                        onClick={() => {
                          handleVoice(voice)
                        }}
                      >
                        {voice}
                      </MenuItem>
                    ))}
                  </Menu>
                </div>
                <button className="generate" type="submit">
                  <SendIcon />
                </button>
              </div>
            </form>
          </Box>
        </Modal>
      </div>
    </>
  )
}
