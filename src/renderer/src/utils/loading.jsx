export const Loading = ({ setLoading }) => {
  return (
    <>
      <div
        style={{
          background:
            'radial-gradient(circle, rgba(0,0,0) 0%, rgba(0,0,0,0.5970763305322129) 100%)',
          display: setLoading ? 'flex' : 'none',
          width: '100%',
          height: '100%',
          justifyContent: 'center',
          alignItems: 'center',
          position: 'fixed',
          top: 0,
          left: 0,
          fontSize: '20px',
          backdropFilter: 'blur(1px)',
          zIndex: '999'
        }}
      >
        <div className="custom-loader"></div>
      </div>
    </>
  )
}
