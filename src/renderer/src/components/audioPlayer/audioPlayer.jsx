import { useState } from 'react'
import { Box, Modal } from '@mui/material'
import AudioPlayer from 'react-h5-audio-player'
export const Player = (props) => {
  const [open, setOpen] = useState(false)
  const handleOpen = () => setOpen(true)
  const handleClose = () => setOpen(false)

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 400,
    bgcolor: 'transparent',
    border: '0',
    boxShadow: 24,
    p: 0
  }

  return (
    <div>
      <button className="light-button2" onClick={handleOpen}>
        {' '}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="20px"
          filter="scale(2)"
          viewBox="0 -960 960 960"
          width="20px"
          fill="#dcdbd6"
        >
          <path d="m384-312 264-168-264-168v336Zm96.28 216Q401-96 331-126t-122.5-82.5Q156-261 126-330.96t-30-149.5Q96-560 126-629.5q30-69.5 82.5-122T330.96-834q69.96-30 149.5-30t149.04 30q69.5 30 122 82.5T834-629.28q30 69.73 30 149Q864-401 834-331t-82.5 122.5Q699-156 629.28-126q-69.73 30-149 30Zm-.28-72q130 0 221-91t91-221q0-130-91-221t-221-91q-130 0-221 91t-91 221q0 130 91 221t221 91Zm0-312Z" />
        </svg>
      </button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <AudioPlayer showJumpControls={false} autoPlay src={props.path} />
        </Box>
      </Modal>
    </div>
  )
}
