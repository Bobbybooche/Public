const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

const AUDIO_DIR = path.join(__dirname, '../../public/audio');

/**
 * GET /audio/:filename
 * Serve audio files with proper headers for streaming
 */
router.get('/:filename', (req, res) => {
  try {
    const { filename } = req.params;

    // Sanitize filename to prevent directory traversal
    const sanitizedFilename = path.basename(filename);
    const filePath = path.join(AUDIO_DIR, sanitizedFilename);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Audio file not found' });
    }

    // Get file stats for content-length
    const stat = fs.statSync(filePath);

    // Set appropriate headers for audio streaming
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', stat.size);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year

    // Handle range requests for seeking
    const range = req.headers.range;
    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunkSize = end - start + 1;

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${stat.size}`);
      res.setHeader('Content-Length', chunkSize);

      const stream = fs.createReadStream(filePath, { start, end });
      stream.pipe(res);
    } else {
      // Stream the entire file
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    }
  } catch (error) {
    console.error('Error serving audio:', error);
    res.status(500).json({ error: 'Failed to serve audio file' });
  }
});

/**
 * GET /audio
 * List all available audio files
 */
router.get('/', (req, res) => {
  try {
    if (!fs.existsSync(AUDIO_DIR)) {
      return res.json([]);
    }

    const files = fs.readdirSync(AUDIO_DIR)
      .filter(file => file.endsWith('.mp3'))
      .map(file => ({
        filename: file,
        url: `/audio/${file}`
      }));

    res.json(files);
  } catch (error) {
    console.error('Error listing audio files:', error);
    res.status(500).json({ error: 'Failed to list audio files' });
  }
});

module.exports = router;
