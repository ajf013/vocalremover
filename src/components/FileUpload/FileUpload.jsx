import React, { useCallback } from 'react';
import { Icon } from 'semantic-ui-react';
import './FileUpload.css';

const FileUpload = ({ onFileSelect }) => {
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            onFileSelect(file);
        }
    };

    return (
        <div className="upload-container" data-aos="zoom-in">
            <label htmlFor="file-upload" className="upload-box">
                <Icon name="cloud upload" size="huge" className="upload-icon" />
                <h3>Click to Upload Song</h3>
                <p>Supports MP3, WAV, OGG, FLAC</p>
                <input
                    type="file"
                    id="file-upload"
                    accept="audio/*"
                    onChange={handleFileChange}
                    hidden
                />
            </label>
        </div>
    );
};

export default FileUpload;
