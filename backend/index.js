require('dotenv').config();
const express = require('express');
const multer = require('multer');
const axios = require('axios');
const fs = require('fs').promises;
const dotenv = require('dotenv');
dotenv.config();

const app = express();
const upload = multer({ dest: 'uploads/' });
const PORT = 3000;
const ASSEMBLYAI_API = 'https://api.assemblyai.com/v2';

app.post('/analyze', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No audio file uploaded');
    }
    const audioData = await fs.readFile(req.file.path);
    const uploadRes = await axios.post(`${ASSEMBLYAI_API}/upload`, audioData, {
      headers: { authorization: process.env.ASSEMBLYAI_API_KEY, 'content-type': 'application/octet-stream' },
    });
    const audioUrl = uploadRes.data.upload_url;

    const transcriptRes = await axios.post(`${ASSEMBLYAI_API}/transcript`, {
      audio_url: audioUrl,
      sentiment_analysis: true,
      entity_detection: true,
    }, { headers: { authorization: process.env.ASSEMBLYAI_API_KEY } });
    const transcriptId = transcriptRes.data.id;

    let result;
    while (true) {
      const pollRes = await axios.get(`${ASSEMBLYAI_API}/transcript/${transcriptId}`, {
        headers: { authorization: process.env.ASSEMBLYAI_API_KEY },
      });
      if (pollRes.data.status === 'completed') {
        result = pollRes.data;
        break;
      } else if (pollRes.data.status === 'error') {
        throw new Error('Transcription failed');
      }
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    const fillers = result.entities ? result.entities.filter(e => e.entity_type === 'filler').length : 0;
    const sentimentScore = result.sentiment_analysis_results
      ? result.sentiment_analysis_results.reduce((acc, curr) => acc + (curr.sentiment === 'POSITIVE' ? 1 : curr.sentiment === 'NEUTRAL' ? 0.5 : 0), 0) / result.sentiment_analysis_results.length
      : 0;
    const speakingRate = result.words ? result.words.length / (result.audio_duration / 60) : 0;
    const confidence = Math.round(0.4 * sentimentScore * 100 + 0.3 * (fillers < 5 ? 100 : 50) + 0.3 * (speakingRate >= 120 && speakingRate <= 150 ? 100 : 60));

    const tips = [];
    if (sentimentScore < 0.7) tips.push('Try a more positive tone to sound confident');
    if (fillers > 5) tips.push('Reduce filler words (e.g., "um") for authority');
    if (speakingRate > 150) tips.push('Slow down to improve clarity');
    else if (speakingRate < 120) tips.push('Speak faster for more energy');

    res.json({ transcript: result.text, confidence, tips });
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (req.file) await fs.unlink(req.file.path);
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));