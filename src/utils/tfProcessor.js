import * as tf from '@tensorflow/tfjs';

/**
 * Simulates an AI-based separation using TensorFlow.js tensors.
 * Process in chunks to avoid "Set maximum size exceeded" or WebGL OOM errors.
 * 
 * @param {AudioBuffer} audioBuffer 
 * @returns {Promise<{vocal: Float32Array, instrument: Float32Array, chorus: Float32Array}>}
 */
export const processWithTFJS = async (audioBuffer) => {
    const inputL = audioBuffer.getChannelData(0);
    const inputR = audioBuffer.numberOfChannels > 1 ? audioBuffer.getChannelData(1) : inputL;

    // Chunk size: 30 seconds * sampleRate
    const CHUNK_SIZE = 30 * audioBuffer.sampleRate;
    const totalLength = inputL.length;

    // Output Holders
    const vocalResult = new Float32Array(totalLength);
    const instrResult = new Float32Array(totalLength);
    const chorusResult = new Float32Array(totalLength);

    for (let offset = 0; offset < totalLength; offset += CHUNK_SIZE) {
        const end = Math.min(offset + CHUNK_SIZE, totalLength);

        // Slice chunks
        const chunkL = inputL.slice(offset, end);
        const chunkR = inputR.slice(offset, end);

        // Process chunk in tidy()
        const chunkResults = tf.tidy(() => {
            const tensorL = tf.tensor1d(chunkL);
            const tensorR = tf.tensor1d(chunkR);

            const sum = tensorL.add(tensorR);
            const diff = tensorL.sub(tensorR);

            const mid = sum.div(tf.scalar(2.0));
            const side = diff.div(tf.scalar(2.0));

            const midAbs = mid.abs();
            const sideAbs = side.abs();

            // mask = sigmoid((mid - side) * gain)
            // Reduced gain from 5.0 to 2.0 for softer masking (less artifacts, more bleed)
            const maskLogit = midAbs.sub(sideAbs).mul(tf.scalar(2.0));
            const vocalMask = maskLogit.sigmoid();

            // Refined prediction:
            const predVocal = mid.mul(vocalMask);

            // Instruments: Subtract Predicted Vocal from Center, then add Side.
            // Instr = (Mid - PredVocal) + Side
            const centerResidual = mid.sub(predVocal);
            const predInstr = centerResidual.add(side);

            // Chorus: Reduced boost
            const predChorus = side.mul(tf.scalar(1.0));

            return {
                vocal: predVocal.dataSync(),
                instr: predInstr.dataSync(),
                chorus: predChorus.dataSync()
            };
        });

        // Copy chunk results to main output
        vocalResult.set(chunkResults.vocal, offset);
        instrResult.set(chunkResults.instr, offset);
        chorusResult.set(chunkResults.chorus, offset);

        // Optional: Yield to main thread to prevent UI freeze
        if (offset + CHUNK_SIZE < totalLength) {
            await new Promise(r => setTimeout(r, 0));
        }
    }

    return {
        vocalData: vocalResult,
        instrData: instrResult,
        chorusData: chorusResult,
        sampleRate: audioBuffer.sampleRate
    };
};
