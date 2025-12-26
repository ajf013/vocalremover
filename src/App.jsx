import React, { useState, useEffect } from 'react';
import AOS from 'aos';
import 'aos/dist/aos.css';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import FileUpload from './components/FileUpload/FileUpload';
import TrackPlayer from './components/TrackPlayer/TrackPlayer';
import { Icon, Loader, Dimmer } from 'semantic-ui-react';
import { processWithTFJS } from './utils/tfProcessor';
import * as lamejs from 'lamejs';
import './App.css';

function App() {
  const [file, setFile] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [separated, setSeparated] = useState(false);

  // Stems
  const [vocalUrl, setVocalUrl] = useState(null);
  const [instrumentUrl, setInstrumentUrl] = useState(null);
  const [chorusUrl, setChorusUrl] = useState(null);

  useEffect(() => {
    AOS.init({
      duration: 1000,
      once: true,
    });
  }, []);

  const processAudio = async (file) => {
    setProcessing(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

      // Use TensorFlow.js Processor
      const { vocalData, instrData, chorusData, sampleRate } = await processWithTFJS(audioBuffer);

      // Helper to encode Float32Array to MP3 Blob using lamejs
      const encodeMp3 = (float32Array, sampleRate) => {
        const lame = window.lamejs; // Assumes lamejs is loaded globally or imported
        // Note: lamejs expects Int16 samples (signed 16-bit)

        const samples = new Int16Array(float32Array.length);
        for (let i = 0; i < float32Array.length; i++) {
          // Clamp and scale
          let s = Math.max(-1, Math.min(1, float32Array[i]));
          samples[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
        }

        const mp3encoder = new lamejs.Mp3Encoder(1, sampleRate, 128); // Mono, SampleRate, 128kbps
        const mp3Data = [];

        // Encode in chunks
        const sampleBlock = 1152;
        for (let i = 0; i < samples.length; i += sampleBlock) {
          const chunk = samples.subarray(i, i + sampleBlock);
          const mp3buf = mp3encoder.encodeBuffer(chunk);
          if (mp3buf.length > 0) {
            mp3Data.push(mp3buf);
          }
        }

        const mp3end = mp3encoder.flush();
        if (mp3end.length > 0) {
          mp3Data.push(mp3end);
        }

        return new Blob(mp3Data, { type: 'audio/mp3' });
      };

      const blobVocal = encodeMp3(vocalData, sampleRate);
      const blobInstr = encodeMp3(instrData, sampleRate);
      const blobChorus = encodeMp3(chorusData, sampleRate);

      setVocalUrl(URL.createObjectURL(blobVocal));
      setInstrumentUrl(URL.createObjectURL(blobInstr));
      setChorusUrl(URL.createObjectURL(blobChorus));

      setSeparated(true);

    } catch (e) {
      console.error("Processing failed", e);
      alert("Error processing audio: " + e.message);
    } finally {
      setProcessing(false);
    }
  };

  // Clean up unused WAV helper if you wish, or keep for fallback
  // I will just remove it to keep this chunk clean as we are replacing bufferToWav calls entirely.

  const handleFileSelect = (selectedFile) => {
    setFile(selectedFile);
    processAudio(selectedFile);
  };

  const handleReset = () => {
    setFile(null);
    setVocalUrl(null);
    setInstrumentUrl(null);
    setChorusUrl(null);
    setSeparated(false);
  };

  return (
    <div className="main-content">
      <Header />

      <main className="container">
        {!file && (
          <FileUpload onFileSelect={handleFileSelect} />
        )}

        {processing && (
          <Dimmer active inverted>
            <Loader size='large' content='Separating with TensorFlow.js (AI)...' />
          </Dimmer>
        )}

        {separated && (
          <div className="results-container">
            <div className="results-header" data-aos="fade-down">
              <h2>Separation Results</h2>
              <button className="reset-btn" onClick={handleReset}>
                <Icon name="redo" /> Process New Song
              </button>
            </div>

            {vocalUrl && <TrackPlayer
              title="Vocals (Center Channel)"
              audioSrc={vocalUrl}
              color="#bb86fc"
            />}

            {instrumentUrl && <TrackPlayer
              title="Instruments (Karaoke/Side)"
              audioSrc={instrumentUrl}
              color="#03dac6"
            />}

            {chorusUrl && <TrackPlayer
              title="Chorus / Backing (Boosted Side)"
              audioSrc={chorusUrl}
              color="#ff0266"
            />}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default App;
