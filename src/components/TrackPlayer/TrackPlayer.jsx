import React, { useEffect, useRef, useState } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { Icon } from 'semantic-ui-react';
import './TrackPlayer.css';

const TrackPlayer = ({ title, audioSrc, color }) => {
    const waveformRef = useRef(null);
    const wavesurfer = useRef(null);
    const [playing, setPlaying] = useState(false);

    const [volume, setVolume] = useState(1);

    useEffect(() => {
        if (waveformRef.current) {
            wavesurfer.current = WaveSurfer.create({
                container: waveformRef.current,
                waveColor: '#4a4a4a',
                progressColor: color || '#bb86fc',
                cursorColor: color || '#bb86fc',
                barWidth: 2,
                barRadius: 3,
                responsive: true,
                height: 80,
            });

            wavesurfer.current.load(audioSrc);
            wavesurfer.current.on('finish', () => setPlaying(false));

            return () => wavesurfer.current.destroy();
        }
    }, [audioSrc, color]);

    // Handle volume change
    useEffect(() => {
        if (wavesurfer.current) {
            wavesurfer.current.setVolume(volume);
        }
    }, [volume]);

    const handlePlayPause = () => {
        if (wavesurfer.current) {
            wavesurfer.current.playPause();
            setPlaying(!playing);
        }
    };

    return (
        <div className="track-player" data-aos="fade-right">
            <div className="track-info">
                <h3>{title}</h3>
                <button className="play-btn" onClick={handlePlayPause}>
                    <Icon name={playing ? 'pause' : 'play'} size="large" />
                </button>
            </div>
            <div className="waveform" ref={waveformRef}></div>

            <div className="controls">
                <div className="volume-control">
                    <Icon name={volume === 0 ? 'volume off' : 'volume up'} />
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.01"
                        value={volume}
                        onChange={(e) => setVolume(parseFloat(e.target.value))}
                        className="volume-slider"
                    />
                </div>
                <a href={audioSrc} download={`${title}.wav`} className="download-link">
                    <Icon name="download" />
                </a>
            </div>
        </div>
    );
};

export default TrackPlayer;
