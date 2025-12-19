#!/usr/bin/env node

/**
 * Audio Generation Script for Municipality Learner
 *
 * This script generates TTS (Text-to-Speech) audio files for municipality names.
 * You can use various TTS services like:
 * - Google Cloud Text-to-Speech
 * - Amazon Polly
 * - Microsoft Azure Speech
 * - Local TTS engines
 *
 * Usage:
 *   node generate-audio.js [options]
 *
 * Options:
 *   --service <name>    TTS service to use (google, aws, azure, local)
 *   --country <code>    Country code to generate audio for (e.g., SI for Slovenia)
 *   --dry-run           Show what would be generated without creating files
 */

const fs = require('fs');
const path = require('path');

// Output directory
const AUDIO_DIR = path.join(__dirname, '../public/audio');

// Municipality list (loaded from database in real usage)
// For demonstration, this is a hardcoded sample
const MUNICIPALITIES = {
  SI: [
    { name: 'Ljubljana', file: 'si-ljubljana.mp3' },
    { name: 'Maribor', file: 'si-maribor.mp3' },
    { name: 'Celje', file: 'si-celje.mp3' },
    { name: 'Kranj', file: 'si-kranj.mp3' },
    { name: 'Koper', file: 'si-koper.mp3' },
    // ... more municipalities
  ]
};

// Language codes for TTS
const LANGUAGE_CODES = {
  SI: 'sl-SI', // Slovenian
  HR: 'hr-HR', // Croatian
  AT: 'de-AT', // Austrian German
  IT: 'it-IT', // Italian
  HU: 'hu-HU', // Hungarian
};

/**
 * Ensure output directory exists
 */
function ensureAudioDir() {
  if (!fs.existsSync(AUDIO_DIR)) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
    console.log(`Created audio directory: ${AUDIO_DIR}`);
  }
}

/**
 * Generate audio using Google Cloud TTS
 * Requires: npm install @google-cloud/text-to-speech
 */
async function generateWithGoogle(text, outputPath, languageCode) {
  try {
    const textToSpeech = require('@google-cloud/text-to-speech');
    const client = new textToSpeech.TextToSpeechClient();

    const request = {
      input: { text },
      voice: { languageCode, ssmlGender: 'NEUTRAL' },
      audioConfig: { audioEncoding: 'MP3' },
    };

    const [response] = await client.synthesizeSpeech(request);
    fs.writeFileSync(outputPath, response.audioContent, 'binary');
    return true;
  } catch (error) {
    console.error(`Error generating audio for "${text}":`, error.message);
    return false;
  }
}

/**
 * Generate audio using AWS Polly
 * Requires: npm install aws-sdk
 */
async function generateWithAWS(text, outputPath, languageCode) {
  try {
    const AWS = require('aws-sdk');
    const polly = new AWS.Polly({ region: 'us-east-1' });

    const params = {
      Text: text,
      OutputFormat: 'mp3',
      VoiceId: getPollyVoice(languageCode),
    };

    const data = await polly.synthesizeSpeech(params).promise();
    fs.writeFileSync(outputPath, data.AudioStream);
    return true;
  } catch (error) {
    console.error(`Error generating audio for "${text}":`, error.message);
    return false;
  }
}

/**
 * Get appropriate Polly voice for language
 */
function getPollyVoice(languageCode) {
  const voices = {
    'sl-SI': 'Maxim', // Using Russian as fallback (no Slovenian in Polly)
    'hr-HR': 'Maxim',
    'de-AT': 'Hans',
    'it-IT': 'Giorgio',
    'hu-HU': 'Maxim',
  };
  return voices[languageCode] || 'Joanna';
}

/**
 * Generate placeholder audio file (for testing without TTS)
 */
function generatePlaceholder(outputPath) {
  // Create an empty file as placeholder
  fs.writeFileSync(outputPath, '');
  return true;
}

/**
 * Main function
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const serviceArg = args.find(a => a.startsWith('--service='));
  const countryArg = args.find(a => a.startsWith('--country='));

  const service = serviceArg ? serviceArg.split('=')[1] : 'placeholder';
  const countryFilter = countryArg ? countryArg.split('=')[1].toUpperCase() : null;

  console.log('Municipality Audio Generator');
  console.log('============================');
  console.log(`Service: ${service}`);
  console.log(`Country filter: ${countryFilter || 'All'}`);
  console.log(`Dry run: ${dryRun}`);
  console.log('');

  ensureAudioDir();

  // Get countries to process
  const countries = countryFilter
    ? { [countryFilter]: MUNICIPALITIES[countryFilter] }
    : MUNICIPALITIES;

  let generated = 0;
  let skipped = 0;
  let errors = 0;

  for (const [countryCode, municipalities] of Object.entries(countries)) {
    if (!municipalities) {
      console.log(`No municipalities found for ${countryCode}`);
      continue;
    }

    const languageCode = LANGUAGE_CODES[countryCode] || 'en-US';
    console.log(`\nProcessing ${countryCode} (${municipalities.length} municipalities)`);

    for (const municipality of municipalities) {
      const outputPath = path.join(AUDIO_DIR, municipality.file);

      // Skip if file already exists
      if (fs.existsSync(outputPath)) {
        skipped++;
        continue;
      }

      if (dryRun) {
        console.log(`  Would generate: ${municipality.file} for "${municipality.name}"`);
        generated++;
        continue;
      }

      console.log(`  Generating: ${municipality.file}...`);

      let success = false;
      switch (service) {
        case 'google':
          success = await generateWithGoogle(municipality.name, outputPath, languageCode);
          break;
        case 'aws':
          success = await generateWithAWS(municipality.name, outputPath, languageCode);
          break;
        case 'placeholder':
        default:
          success = generatePlaceholder(outputPath);
          break;
      }

      if (success) {
        generated++;
      } else {
        errors++;
      }

      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log('\n============================');
  console.log(`Generated: ${generated}`);
  console.log(`Skipped (existing): ${skipped}`);
  console.log(`Errors: ${errors}`);
}

main().catch(console.error);
