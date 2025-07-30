import textToSpeech from '@google-cloud/text-to-speech';
import { TTSRequest } from '@/types';
import logger from '@/utils/logger';
import fs from 'fs';
import path from 'path';

class TTSService {
  private client: textToSpeech.TextToSpeechClient;
  private outputDir: string;

  constructor() {
    // Initialize Google Cloud TTS client
    this.client = new textToSpeech.TextToSpeechClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });

    // Ensure output directory exists
    this.outputDir = path.join(process.cwd(), 'uploads', 'audio', 'tts');
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Convert text to speech and return audio buffer
   */
  async synthesizeSpeech(request: TTSRequest): Promise<{
    audioContent: Buffer;
    audioUrl?: string;
    duration?: number;
  }> {
    try {
      const { text, language = 'en-US', voice, speed = 1.0 } = request;

      // Configure the synthesis request
      const synthesisRequest = {
        input: { text },
        voice: {
          languageCode: language,
          name: voice || this.getDefaultVoice(language),
          ssmlGender: 'NEUTRAL' as const
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: speed,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      };

      // Perform the synthesis
      const [response] = await this.client.synthesizeSpeech(synthesisRequest);

      if (!response.audioContent) {
        throw new Error('No audio content received from TTS service');
      }

      const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

      // Save audio file
      const filename = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
      const filepath = path.join(this.outputDir, filename);
      
      fs.writeFileSync(filepath, audioBuffer);

      // Calculate approximate duration (rough estimate)
      const wordsPerMinute = 150;
      const wordCount = text.split(' ').length;
      const estimatedDuration = Math.ceil((wordCount / wordsPerMinute) * 60 / speed);

      logger.info('Text-to-speech synthesis completed', {
        textLength: text.length,
        language,
        voice: voice || 'default',
        speed,
        outputFile: filename,
        estimatedDuration
      });

      return {
        audioContent: audioBuffer,
        audioUrl: `/uploads/audio/tts/${filename}`,
        duration: estimatedDuration
      };

    } catch (error) {
      logger.error('Error in text-to-speech synthesis:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  /**
   * Convert text to speech with SSML markup support
   */
  async synthesizeSpeechWithSSML(ssml: string, options: {
    language?: string;
    voice?: string;
    speed?: number;
  } = {}): Promise<{
    audioContent: Buffer;
    audioUrl?: string;
    duration?: number;
  }> {
    try {
      const { language = 'en-US', voice, speed = 1.0 } = options;

      const synthesisRequest = {
        input: { ssml },
        voice: {
          languageCode: language,
          name: voice || this.getDefaultVoice(language),
          ssmlGender: 'NEUTRAL' as const
        },
        audioConfig: {
          audioEncoding: 'MP3' as const,
          speakingRate: speed,
          pitch: 0.0,
          volumeGainDb: 0.0
        }
      };

      const [response] = await this.client.synthesizeSpeech(synthesisRequest);

      if (!response.audioContent) {
        throw new Error('No audio content received from TTS service');
      }

      const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

      // Save audio file
      const filename = `tts_ssml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
      const filepath = path.join(this.outputDir, filename);
      
      fs.writeFileSync(filepath, audioBuffer);

      logger.info('SSML text-to-speech synthesis completed', {
        ssmlLength: ssml.length,
        language,
        voice: voice || 'default',
        speed,
        outputFile: filename
      });

      return {
        audioContent: audioBuffer,
        audioUrl: `/uploads/audio/tts/${filename}`,
        duration: undefined // Difficult to estimate with SSML
      };

    } catch (error) {
      logger.error('Error in SSML text-to-speech synthesis:', error);
      throw new Error('Failed to synthesize speech with SSML');
    }
  }

  /**
   * Generate interview question audio
   */
  async generateQuestionAudio(question: string, options: {
    language?: string;
    voice?: string;
    speed?: number;
  } = {}): Promise<{
    audioContent: Buffer;
    audioUrl: string;
    duration?: number;
  }> {
    try {
      // Add some pauses and emphasis for better interview experience
      const enhancedQuestion = this.enhanceQuestionText(question);
      
      const result = await this.synthesizeSpeech({
        text: enhancedQuestion,
        ...options
      });

      logger.info('Generated interview question audio', {
        questionLength: question.length,
        enhancedLength: enhancedQuestion.length
      });

      return result as any;

    } catch (error) {
      logger.error('Error generating question audio:', error);
      throw new Error('Failed to generate question audio');
    }
  }

  /**
   * Generate feedback audio
   */
  async generateFeedbackAudio(feedback: string, options: {
    language?: string;
    voice?: string;
    speed?: number;
  } = {}): Promise<{
    audioContent: Buffer;
    audioUrl: string;
    duration?: number;
  }> {
    try {
      // Use SSML for better feedback delivery
      const ssml = this.createFeedbackSSML(feedback);
      
      const result = await this.synthesizeSpeechWithSSML(ssml, options);

      logger.info('Generated feedback audio', {
        feedbackLength: feedback.length,
        ssmlLength: ssml.length
      });

      return result as any;

    } catch (error) {
      logger.error('Error generating feedback audio:', error);
      throw new Error('Failed to generate feedback audio');
    }
  }

  /**
   * Get available voices for a language
   */
  async getAvailableVoices(languageCode: string = 'en-US'): Promise<any[]> {
    try {
      const [result] = await this.client.listVoices({
        languageCode
      });

      const voices = result.voices || [];
      
      logger.info('Retrieved available voices', {
        languageCode,
        voiceCount: voices.length
      });

      return voices.map(voice => ({
        name: voice.name,
        ssmlGender: voice.ssmlGender,
        naturalSampleRateHertz: voice.naturalSampleRateHertz,
        languageCodes: voice.languageCodes
      }));

    } catch (error) {
      logger.error('Error retrieving available voices:', error);
      throw new Error('Failed to retrieve available voices');
    }
  }

  /**
   * Convert multiple texts to speech (batch processing)
   */
  async batchSynthesize(requests: TTSRequest[]): Promise<Array<{
    audioContent: Buffer;
    audioUrl: string;
    originalText: string;
  }>> {
    try {
      const results = await Promise.all(
        requests.map(async (request, index) => {
          const result = await this.synthesizeSpeech(request);
          return {
            ...result,
            originalText: request.text
          };
        })
      );

      logger.info('Batch TTS synthesis completed', {
        requestCount: requests.length,
        successCount: results.length
      });

      return results as any;

    } catch (error) {
      logger.error('Error in batch TTS synthesis:', error);
      throw new Error('Failed to complete batch synthesis');
    }
  }

  /**
   * Get default voice for a language
   */
  private getDefaultVoice(language: string): string {
    const defaultVoices: { [key: string]: string } = {
      'en-US': 'en-US-Neural2-D',
      'en-GB': 'en-GB-Neural2-A',
      'es-ES': 'es-ES-Neural2-A',
      'fr-FR': 'fr-FR-Neural2-A',
      'de-DE': 'de-DE-Neural2-A',
      'it-IT': 'it-IT-Neural2-A',
      'pt-BR': 'pt-BR-Neural2-A',
      'ja-JP': 'ja-JP-Neural2-B',
      'ko-KR': 'ko-KR-Neural2-A',
      'zh-CN': 'cmn-CN-Standard-A'
    };

    return defaultVoices[language] || defaultVoices['en-US'];
  }

  /**
   * Enhance question text for better speech delivery
   */
  private enhanceQuestionText(question: string): string {
    // Add pauses and emphasis
    let enhanced = question;

    // Add pause after question number if present
    enhanced = enhanced.replace(/^(\d+\.\s?)/, '$1<break time="0.5s"/>');
    
    // Add pause before question mark
    enhanced = enhanced.replace(/\?$/, '<break time="0.3s"/>?');
    
    // Add emphasis to key words
    const keyWords = ['explain', 'describe', 'how', 'why', 'what', 'when', 'where', 'who'];
    keyWords.forEach(word => {
      const regex = new RegExp(`\\b${word}\\b`, 'gi');
      enhanced = enhanced.replace(regex, `<emphasis level="moderate">${word}</emphasis>`);
    });

    return enhanced;
  }

  /**
   * Create SSML for feedback delivery
   */
  private createFeedbackSSML(feedback: string): string {
    return `
      <speak>
        <prosody rate="medium" pitch="medium">
          <break time="0.5s"/>
          ${feedback}
          <break time="1s"/>
        </prosody>
      </speak>
    `;
  }

  /**
   * Clean up old TTS files
   */
  async cleanupOldFiles(olderThanHours: number = 24): Promise<void> {
    try {
      const files = fs.readdirSync(this.outputDir);
      const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
      
      let deletedCount = 0;
      
      for (const file of files) {
        const filepath = path.join(this.outputDir, file);
        const stats = fs.statSync(filepath);
        
        if (stats.mtime.getTime() < cutoffTime) {
          fs.unlinkSync(filepath);
          deletedCount++;
        }
      }

      logger.info('TTS files cleanup completed', {
        totalFiles: files.length,
        deletedFiles: deletedCount,
        olderThanHours
      });

    } catch (error) {
      logger.error('Error cleaning up TTS files:', error);
    }
  }
}

export default new TTSService();