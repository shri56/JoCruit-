import speech from '@google-cloud/speech';
import { STTRequest } from '@/types';
import logger from '@/utils/logger';
import fs from 'fs';
import path from 'path';

class STTService {
  private client: speech.SpeechClient;

  constructor() {
    // Initialize Google Cloud Speech client
    this.client = new speech.SpeechClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });
  }

  /**
   * Convert speech audio to text
   */
  async transcribeAudio(request: STTRequest): Promise<{
    transcription: string;
    confidence: number;
    words?: Array<{
      word: string;
      startTime: number;
      endTime: number;
      confidence: number;
    }>;
    duration?: number;
  }> {
    try {
      const {
        audioBuffer,
        encoding = 'WEBM_OPUS',
        sampleRateHertz = 48000,
        languageCode = 'en-US'
      } = request;

      // Configure recognition request
      const recognitionRequest = {
        config: {
          encoding: encoding as any,
          sampleRateHertz,
          languageCode,
          enableWordTimeOffsets: true,
          enableAutomaticPunctuation: true,
          enableWordConfidence: true,
          model: 'latest_long',
          useEnhanced: true
        },
        audio: {
          content: audioBuffer.toString('base64')
        }
      };

      // Perform speech recognition
      const [response] = await this.client.recognize(recognitionRequest);

      if (!response.results || response.results.length === 0) {
        logger.warn('No speech recognition results returned');
        return {
          transcription: '',
          confidence: 0,
          words: [],
          duration: 0
        };
      }

      // Extract the best result
      const result = response.results[0];
      const alternative = result.alternatives?.[0];

      if (!alternative) {
        throw new Error('No alternative transcription found');
      }

      // Extract word-level information
      const words = alternative.words?.map(word => ({
        word: word.word || '',
        startTime: parseFloat(word.startTime?.seconds || '0') + 
                  parseFloat(word.startTime?.nanos || '0') / 1e9,
        endTime: parseFloat(word.endTime?.seconds || '0') + 
                parseFloat(word.endTime?.nanos || '0') / 1e9,
        confidence: word.confidence || 0
      })) || [];

      const transcription = alternative.transcript || '';
      const confidence = alternative.confidence || 0;
      
      // Calculate duration from word timings
      const duration = words.length > 0 ? 
        Math.max(...words.map(w => w.endTime)) : 0;

      logger.info('Speech-to-text transcription completed', {
        transcriptionLength: transcription.length,
        confidence,
        wordCount: words.length,
        duration,
        languageCode
      });

      return {
        transcription,
        confidence,
        words,
        duration
      };

    } catch (error) {
      logger.error('Error in speech-to-text transcription:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * Transcribe audio file from path
   */
  async transcribeAudioFile(filePath: string, options: {
    encoding?: string;
    sampleRateHertz?: number;
    languageCode?: string;
  } = {}): Promise<{
    transcription: string;
    confidence: number;
    words?: Array<{
      word: string;
      startTime: number;
      endTime: number;
      confidence: number;
    }>;
    duration?: number;
  }> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error('Audio file not found');
      }

      const audioBuffer = fs.readFileSync(filePath);
      
      // Detect encoding from file extension if not provided
      const extension = path.extname(filePath).toLowerCase();
      const encoding = options.encoding || this.getEncodingFromExtension(extension);

      const result = await this.transcribeAudio({
        audioBuffer,
        encoding,
        sampleRateHertz: options.sampleRateHertz,
        languageCode: options.languageCode
      });

      logger.info('Transcribed audio file', {
        filePath,
        fileSize: audioBuffer.length,
        encoding,
        transcriptionLength: result.transcription.length
      });

      return result;

    } catch (error) {
      logger.error('Error transcribing audio file:', error);
      throw new Error('Failed to transcribe audio file');
    }
  }

  /**
   * Long running transcription for longer audio files
   */
  async transcribeLongAudio(audioBuffer: Buffer, options: {
    encoding?: string;
    sampleRateHertz?: number;
    languageCode?: string;
    storageUri?: string;
  } = {}): Promise<{
    transcription: string;
    confidence: number;
    segments: Array<{
      text: string;
      startTime: number;
      endTime: number;
      confidence: number;
    }>;
    duration?: number;
  }> {
    try {
      const {
        encoding = 'WEBM_OPUS',
        sampleRateHertz = 48000,
        languageCode = 'en-US',
        storageUri
      } = options;

      let audioSource;
      if (storageUri) {
        audioSource = { uri: storageUri };
      } else {
        audioSource = { content: audioBuffer.toString('base64') };
      }

      const longRunningRequest = {
        config: {
          encoding: encoding as any,
          sampleRateHertz,
          languageCode,
          enableWordTimeOffsets: true,
          enableAutomaticPunctuation: true,
          enableWordConfidence: true,
          enableSpeakerDiarization: true,
          diarizationConfig: {
            enableSpeakerDiarization: true,
            minSpeakerCount: 1,
            maxSpeakerCount: 2
          },
          model: 'latest_long',
          useEnhanced: true
        },
        audio: audioSource
      };

      // Start long running operation
      const [operation] = await this.client.longRunningRecognize(longRunningRequest);

      // Wait for completion
      const [response] = await operation.promise();

      if (!response.results || response.results.length === 0) {
        logger.warn('No long-running speech recognition results returned');
        return {
          transcription: '',
          confidence: 0,
          segments: [],
          duration: 0
        };
      }

      // Process results into segments
      const segments = response.results.map(result => {
        const alternative = result.alternatives?.[0];
        if (!alternative) return null;

        const words = alternative.words || [];
        const startTime = words.length > 0 ? 
          parseFloat(words[0].startTime?.seconds || '0') + 
          parseFloat(words[0].startTime?.nanos || '0') / 1e9 : 0;
        
        const endTime = words.length > 0 ? 
          parseFloat(words[words.length - 1].endTime?.seconds || '0') + 
          parseFloat(words[words.length - 1].endTime?.nanos || '0') / 1e9 : 0;

        return {
          text: alternative.transcript || '',
          startTime,
          endTime,
          confidence: alternative.confidence || 0
        };
      }).filter(Boolean) as any[];

      const transcription = segments.map(s => s.text).join(' ');
      const averageConfidence = segments.length > 0 ? 
        segments.reduce((sum, s) => sum + s.confidence, 0) / segments.length : 0;
      
      const duration = segments.length > 0 ? 
        Math.max(...segments.map(s => s.endTime)) : 0;

      logger.info('Long-running speech-to-text completed', {
        transcriptionLength: transcription.length,
        averageConfidence,
        segmentCount: segments.length,
        duration,
        languageCode
      });

      return {
        transcription,
        confidence: averageConfidence,
        segments,
        duration
      };

    } catch (error) {
      logger.error('Error in long-running speech transcription:', error);
      throw new Error('Failed to transcribe long audio');
    }
  }

  /**
   * Real-time streaming transcription
   */
  createStreamingRecognition(options: {
    encoding?: string;
    sampleRateHertz?: number;
    languageCode?: string;
    onTranscription?: (transcription: string, isFinal: boolean) => void;
    onError?: (error: Error) => void;
  } = {}) {
    const {
      encoding = 'WEBM_OPUS',
      sampleRateHertz = 48000,
      languageCode = 'en-US',
      onTranscription,
      onError
    } = options;

    const recognizeStream = this.client
      .streamingRecognize({
        config: {
          encoding: encoding as any,
          sampleRateHertz,
          languageCode,
          enableAutomaticPunctuation: true,
          model: 'latest_short',
          useEnhanced: true
        },
        interimResults: true
      })
      .on('data', data => {
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          const alternative = result.alternatives?.[0];
          
          if (alternative) {
            const transcription = alternative.transcript || '';
            const isFinal = result.isFinal || false;
            
            if (onTranscription) {
              onTranscription(transcription, isFinal);
            }
            
            logger.debug('Streaming transcription result', {
              transcription,
              isFinal,
              confidence: alternative.confidence
            });
          }
        }
      })
      .on('error', error => {
        logger.error('Streaming recognition error:', error);
        if (onError) {
          onError(error);
        }
      })
      .on('end', () => {
        logger.info('Streaming recognition ended');
      });

    return recognizeStream;
  }

  /**
   * Batch transcribe multiple audio files
   */
  async batchTranscribe(audioFiles: Array<{
    buffer: Buffer;
    filename: string;
    encoding?: string;
    languageCode?: string;
  }>): Promise<Array<{
    filename: string;
    transcription: string;
    confidence: number;
    duration?: number;
    error?: string;
  }>> {
    try {
      const results = await Promise.allSettled(
        audioFiles.map(async file => {
          try {
            const result = await this.transcribeAudio({
              audioBuffer: file.buffer,
              encoding: file.encoding,
              languageCode: file.languageCode
            });

            return {
              filename: file.filename,
              transcription: result.transcription,
              confidence: result.confidence,
              duration: result.duration
            };
          } catch (error) {
            return {
              filename: file.filename,
              transcription: '',
              confidence: 0,
              error: error instanceof Error ? error.message : 'Unknown error'
            };
          }
        })
      );

      const processedResults = results.map(result => {
        if (result.status === 'fulfilled') {
          return result.value;
        } else {
          return {
            filename: 'unknown',
            transcription: '',
            confidence: 0,
            error: result.reason?.message || 'Failed to transcribe'
          };
        }
      });

      logger.info('Batch transcription completed', {
        totalFiles: audioFiles.length,
        successfulTranscriptions: processedResults.filter(r => !r.error).length
      });

      return processedResults;

    } catch (error) {
      logger.error('Error in batch transcription:', error);
      throw new Error('Failed to complete batch transcription');
    }
  }

  /**
   * Get supported languages for speech recognition
   */
  async getSupportedLanguages(): Promise<string[]> {
    // Common supported languages for Google Cloud Speech-to-Text
    return [
      'en-US', 'en-GB', 'en-AU', 'en-CA', 'en-IN',
      'es-ES', 'es-US', 'es-MX',
      'fr-FR', 'fr-CA',
      'de-DE',
      'it-IT',
      'pt-BR', 'pt-PT',
      'ja-JP',
      'ko-KR',
      'zh-CN', 'zh-TW',
      'hi-IN',
      'ar-SA',
      'ru-RU',
      'nl-NL',
      'sv-SE',
      'da-DK',
      'no-NO',
      'fi-FI',
      'pl-PL',
      'tr-TR',
      'th-TH'
    ];
  }

  /**
   * Detect encoding from file extension
   */
  private getEncodingFromExtension(extension: string): string {
    const encodingMap: { [key: string]: string } = {
      '.mp3': 'MP3',
      '.wav': 'LINEAR16',
      '.flac': 'FLAC',
      '.webm': 'WEBM_OPUS',
      '.ogg': 'OGG_OPUS',
      '.m4a': 'MP3', // Fallback to MP3 for M4A
      '.aac': 'MP3'  // Fallback to MP3 for AAC
    };

    return encodingMap[extension] || 'WEBM_OPUS';
  }

  /**
   * Analyze audio quality and provide recommendations
   */
  async analyzeAudioQuality(audioBuffer: Buffer): Promise<{
    quality: 'poor' | 'fair' | 'good' | 'excellent';
    recommendations: string[];
    estimatedAccuracy: number;
  }> {
    try {
      // Basic audio analysis - in production, you might use more sophisticated audio analysis
      const fileSize = audioBuffer.length;
      const duration = Math.max(1, fileSize / 16000); // Rough estimate

      // Simple quality assessment based on file size and estimated bitrate
      const estimatedBitrate = (fileSize * 8) / duration / 1000; // kbps

      let quality: 'poor' | 'fair' | 'good' | 'excellent';
      let estimatedAccuracy: number;
      const recommendations: string[] = [];

      if (estimatedBitrate < 32) {
        quality = 'poor';
        estimatedAccuracy = 60;
        recommendations.push('Audio quality is low - consider recording at higher bitrate');
        recommendations.push('Check microphone settings and distance');
      } else if (estimatedBitrate < 64) {
        quality = 'fair';
        estimatedAccuracy = 75;
        recommendations.push('Audio quality is acceptable but could be improved');
        recommendations.push('Consider using a better microphone or recording environment');
      } else if (estimatedBitrate < 128) {
        quality = 'good';
        estimatedAccuracy = 85;
        recommendations.push('Good audio quality - should transcribe well');
      } else {
        quality = 'excellent';
        estimatedAccuracy = 95;
        recommendations.push('Excellent audio quality - optimal for transcription');
      }

      // Additional recommendations based on file size
      if (fileSize < 10000) {
        recommendations.push('Audio file seems very short - ensure complete recording');
      }

      logger.info('Audio quality analysis completed', {
        fileSize,
        estimatedBitrate,
        quality,
        estimatedAccuracy
      });

      return {
        quality,
        recommendations,
        estimatedAccuracy
      };

    } catch (error) {
      logger.error('Error analyzing audio quality:', error);
      return {
        quality: 'fair',
        recommendations: ['Unable to analyze audio quality'],
        estimatedAccuracy: 70
      };
    }
  }
}

export default new STTService();