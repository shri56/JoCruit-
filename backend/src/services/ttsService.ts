import { TextToSpeechClient } from '@google-cloud/text-to-speech';
import fs from 'fs';
import path from 'path';
import logger from '@/utils/logger';

interface VoiceSettings {
  languageCode: string;
  voiceName?: string;
  gender: 'MALE' | 'FEMALE' | 'NEUTRAL';
  speakingRate: number; // 0.25 to 4.0
  pitch: number; // -20.0 to 20.0
  volumeGainDb: number; // -96.0 to 16.0
  audioFormat: 'MP3' | 'WAV' | 'OGG';
}

interface TTSRequest {
  text: string;
  voiceSettings?: Partial<VoiceSettings>;
  outputFormat?: 'file' | 'buffer';
  fileName?: string;
}

interface TTSResponse {
  audioBuffer?: Buffer;
  filePath?: string;
  duration?: number;
  voiceUsed: {
    name: string;
    languageCode: string;
    gender: string;
  };
}

class TTSService {
  private client: TextToSpeechClient;
  private audioDir: string;
  private defaultVoiceSettings: VoiceSettings;
  private availableVoices: Map<string, any[]> = new Map();

  constructor() {
    // Initialize Google Cloud TTS client
    this.client = new TextToSpeechClient({
      keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
    });

    this.audioDir = path.join(process.cwd(), 'uploads', 'audio', 'tts');
    if (!fs.existsSync(this.audioDir)) {
      fs.mkdirSync(this.audioDir, { recursive: true });
    }

    this.defaultVoiceSettings = {
      languageCode: 'en-US',
      gender: 'NEUTRAL',
      speakingRate: 1.0,
      pitch: 0.0,
      volumeGainDb: 0.0,
      audioFormat: 'MP3'
    };

    // Cache available voices on startup
    this.cacheAvailableVoices();
  }

  /**
   * Synthesize speech with customizable voice settings
   */
  async synthesizeSpeech(request: TTSRequest): Promise<TTSResponse> {
    try {
      const voiceSettings = { ...this.defaultVoiceSettings, ...request.voiceSettings };
      
      // Validate voice settings
      this.validateVoiceSettings(voiceSettings);

      const ttsRequest = {
        input: { text: request.text },
        voice: {
          languageCode: voiceSettings.languageCode,
          name: voiceSettings.voiceName,
          ssmlGender: voiceSettings.gender,
        },
        audioConfig: {
          audioEncoding: this.getAudioEncoding(voiceSettings.audioFormat),
          speakingRate: voiceSettings.speakingRate,
          pitch: voiceSettings.pitch,
          volumeGainDb: voiceSettings.volumeGainDb,
          sampleRateHertz: voiceSettings.audioFormat === 'WAV' ? 44100 : 24000,
        },
      };

      const [response] = await this.client.synthesizeSpeech(ttsRequest);
      const audioBuffer = Buffer.from(response.audioContent as Uint8Array);

      // Calculate approximate duration (rough estimate)
      const wordsPerMinute = 150; // Average speaking rate
      const wordCount = request.text.split(' ').length;
      const duration = Math.ceil((wordCount / wordsPerMinute) * 60);

      const result: TTSResponse = {
        audioBuffer,
        duration,
        voiceUsed: {
          name: voiceSettings.voiceName || 'default',
          languageCode: voiceSettings.languageCode,
          gender: voiceSettings.gender
        }
      };

      // Save to file if requested
      if (request.outputFormat === 'file' || request.fileName) {
        const fileName = request.fileName || 
          `tts_${Date.now()}.${voiceSettings.audioFormat.toLowerCase()}`;
        const filePath = path.join(this.audioDir, fileName);
        
        fs.writeFileSync(filePath, audioBuffer);
        result.filePath = filePath;
        
        logger.info('TTS audio generated and saved', {
          fileName,
          textLength: request.text.length,
          duration,
          voiceSettings
        });
      }

      return result;

    } catch (error) {
      logger.error('TTS synthesis error:', error);
      throw new Error('Failed to synthesize speech');
    }
  }

  /**
   * Generate question audio with role-specific voice
   */
  async generateQuestionAudio(
    questionText: string,
    interviewId: string,
    questionIndex: number,
    voiceSettings?: Partial<VoiceSettings>
  ): Promise<string> {
    try {
      // Add SSML formatting for better question delivery
      const enhancedText = this.enhanceQuestionText(questionText);
      
      const fileName = `interview_${interviewId}_q${questionIndex}.mp3`;
      
      const result = await this.synthesizeSpeech({
        text: enhancedText,
        voiceSettings: {
          ...voiceSettings,
          speakingRate: voiceSettings?.speakingRate || 0.9, // Slightly slower for questions
          pitch: voiceSettings?.pitch || 2.0, // Slightly higher pitch for engagement
        },
        outputFormat: 'file',
        fileName
      });

      return result.filePath!;

    } catch (error) {
      logger.error('Error generating question audio:', error);
      throw new Error('Failed to generate question audio');
    }
  }

  /**
   * Generate feedback audio
   */
  async generateFeedbackAudio(
    feedbackText: string,
    candidateId: string,
    voiceSettings?: Partial<VoiceSettings>
  ): Promise<string> {
    try {
      const enhancedText = this.enhanceFeedbackText(feedbackText);
      const fileName = `feedback_${candidateId}_${Date.now()}.mp3`;
      
      const result = await this.synthesizeSpeech({
        text: enhancedText,
        voiceSettings: {
          ...voiceSettings,
          speakingRate: voiceSettings?.speakingRate || 0.95,
          pitch: voiceSettings?.pitch || 0.0,
        },
        outputFormat: 'file',
        fileName
      });

      return result.filePath!;

    } catch (error) {
      logger.error('Error generating feedback audio:', error);
      throw new Error('Failed to generate feedback audio');
    }
  }

  /**
   * Get available voices for a language
   */
  async getAvailableVoices(languageCode?: string): Promise<any[]> {
    try {
      if (languageCode && this.availableVoices.has(languageCode)) {
        return this.availableVoices.get(languageCode)!;
      }

      const [response] = await this.client.listVoices({
        languageCode: languageCode || undefined
      });

      const voices = response.voices || [];
      
      if (languageCode) {
        this.availableVoices.set(languageCode, voices);
      }

      return voices.map(voice => ({
        name: voice.name,
        languageCodes: voice.languageCodes,
        gender: voice.ssmlGender,
        naturalSampleRateHertz: voice.naturalSampleRateHertz
      }));

    } catch (error) {
      logger.error('Error fetching available voices:', error);
      return [];
    }
  }

  /**
   * Get voice recommendations based on role and preferences
   */
  getVoiceRecommendations(role: string, preferences?: any): VoiceSettings[] {
    const recommendations: VoiceSettings[] = [];

    // Professional/formal roles
    if (['manager', 'director', 'senior', 'lead'].some(title => 
      role.toLowerCase().includes(title))) {
      recommendations.push({
        languageCode: 'en-US',
        voiceName: 'en-US-Studio-Q', // Professional male voice
        gender: 'MALE',
        speakingRate: 0.95,
        pitch: -2.0,
        volumeGainDb: 2.0,
        audioFormat: 'MP3'
      });
    }

    // Creative/friendly roles
    if (['designer', 'creative', 'marketing', 'sales'].some(title => 
      role.toLowerCase().includes(title))) {
      recommendations.push({
        languageCode: 'en-US',
        voiceName: 'en-US-Studio-O', // Friendly female voice
        gender: 'FEMALE',
        speakingRate: 1.05,
        pitch: 3.0,
        volumeGainDb: 1.0,
        audioFormat: 'MP3'
      });
    }

    // Technical roles
    if (['developer', 'engineer', 'technical', 'software'].some(title => 
      role.toLowerCase().includes(title))) {
      recommendations.push({
        languageCode: 'en-US',
        voiceName: 'en-US-Neural2-I', // Clear neutral voice
        gender: 'NEUTRAL',
        speakingRate: 1.0,
        pitch: 0.0,
        volumeGainDb: 0.0,
        audioFormat: 'MP3'
      });
    }

    // Default recommendation
    if (recommendations.length === 0) {
      recommendations.push(this.defaultVoiceSettings);
    }

    return recommendations;
  }

  /**
   * Create voice preset for admin portal
   */
  createVoicePreset(name: string, settings: VoiceSettings): boolean {
    try {
      // In a real implementation, this would save to database
      // For now, we'll just validate the settings
      this.validateVoiceSettings(settings);
      
      logger.info('Voice preset created', { name, settings });
      return true;
    } catch (error) {
      logger.error('Error creating voice preset:', error);
      return false;
    }
  }

  /**
   * Test voice settings
   */
  async testVoiceSettings(settings: VoiceSettings): Promise<TTSResponse> {
    const testText = "Hello! This is a test of the voice settings you have configured. How does this sound for your interview questions?";
    
    return await this.synthesizeSpeech({
      text: testText,
      voiceSettings: settings,
      outputFormat: 'buffer'
    });
  }

  // Private helper methods

  private validateVoiceSettings(settings: VoiceSettings): void {
    if (settings.speakingRate < 0.25 || settings.speakingRate > 4.0) {
      throw new Error('Speaking rate must be between 0.25 and 4.0');
    }
    
    if (settings.pitch < -20.0 || settings.pitch > 20.0) {
      throw new Error('Pitch must be between -20.0 and 20.0');
    }
    
    if (settings.volumeGainDb < -96.0 || settings.volumeGainDb > 16.0) {
      throw new Error('Volume gain must be between -96.0 and 16.0');
    }
  }

  private getAudioEncoding(format: string): any {
    switch (format.toUpperCase()) {
      case 'MP3':
        return 'MP3';
      case 'WAV':
        return 'LINEAR16';
      case 'OGG':
        return 'OGG_OPUS';
      default:
        return 'MP3';
    }
  }

  private enhanceQuestionText(text: string): string {
    // Add SSML tags for better question delivery
    return `<speak>
      <prosody rate="medium" pitch="medium">
        ${text}
      </prosody>
      <break time="1s"/>
    </speak>`;
  }

  private enhanceFeedbackText(text: string): string {
    // Add SSML tags for natural feedback delivery
    return `<speak>
      <prosody rate="medium" pitch="low">
        ${text}
      </prosody>
    </speak>`;
  }

  private async cacheAvailableVoices(): void {
    try {
      const commonLanguages = ['en-US', 'en-GB', 'en-AU', 'en-IN'];
      
      for (const lang of commonLanguages) {
        const voices = await this.getAvailableVoices(lang);
        this.availableVoices.set(lang, voices);
      }
      
      logger.info('Voice cache initialized', {
        cachedLanguages: Array.from(this.availableVoices.keys())
      });
    } catch (error) {
      logger.warn('Failed to cache voices:', error);
    }
  }

  /**
   * Cleanup old audio files
   */
  async cleanupOldFiles(maxAgeHours: number = 24): Promise<void> {
    try {
      const files = fs.readdirSync(this.audioDir);
      const now = Date.now();
      const maxAge = maxAgeHours * 60 * 60 * 1000;

      let deletedCount = 0;
      
      for (const file of files) {
        const filePath = path.join(this.audioDir, file);
        const stats = fs.statSync(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      }

      logger.info('TTS cleanup completed', {
        deletedFiles: deletedCount,
        maxAgeHours
      });

    } catch (error) {
      logger.error('Error during TTS cleanup:', error);
    }
  }

  /**
   * Batch synthesize multiple texts
   */
  async batchSynthesize(
    texts: string[],
    voiceSettings?: Partial<VoiceSettings>,
    filePrefix?: string
  ): Promise<TTSResponse[]> {
    const results: TTSResponse[] = [];
    
    for (let i = 0; i < texts.length; i++) {
      const fileName = filePrefix ? 
        `${filePrefix}_${i + 1}.mp3` : 
        `batch_${Date.now()}_${i + 1}.mp3`;
      
      const result = await this.synthesizeSpeech({
        text: texts[i],
        voiceSettings,
        outputFormat: 'file',
        fileName
      });
      
      results.push(result);
    }
    
    return results;
  }
}

export default new TTSService();