import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';

const FaceCapture = ({ onCapture, mode = 'register' }) => {
  const webcamRef = useRef(null);
  const [captured, setCaptured] = useState(false);
  const [imageData, setImageData] = useState(null);

  const capture = useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImageData(imageSrc);
    setCaptured(true);
    onCapture(imageSrc);
  }, [webcamRef, onCapture]);

  const retake = () => {
    setCaptured(false);
    setImageData(null);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h3>{mode === 'register' ? 'Register Your Face' : 'Verify Your Identity'}</h3>
      
      {!captured ? (
        <div>
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
          />
          <br />
          <button 
            onClick={capture}
            style={{
              marginTop: '10px',
              padding: '12px 30px',
              fontSize: '16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Capture Face
          </button>
        </div>
      ) : (
        <div>
          <img 
            src={imageData} 
            alt="Captured face" 
            style={{ width: '100%', maxWidth: '500px', borderRadius: '8px' }}
          />
          <br />
          <button 
            onClick={retake}
            style={{
              marginTop: '10px',
              padding: '12px 30px',
              fontSize: '16px',
              backgroundColor: '#f44336',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: 'pointer'
            }}
          >
            Retake
          </button>
        </div>
      )}
    </div>
  );
};

export default FaceCapture;