import { TTSRequest } from '@/types';
declare class TTSService {
    private client;
    private outputDir;
    constructor();
    /**
     * Convert text to speech and return audio buffer
     */
    synthesizeSpeech(request: TTSRequest): Promise<{
        audioContent: Buffer;
        audioUrl?: string;
        duration?: number;
    }>;
    /**
     * Convert text to speech with SSML markup support
     */
    synthesizeSpeechWithSSML(ssml: string, options?: {
        language?: string;
        voice?: string;
        speed?: number;
    }): Promise<{
        audioContent: Buffer;
        audioUrl?: string;
        duration?: number;
    }>;
    /**
     * Generate interview question audio
     */
    generateQuestionAudio(question: string, options?: {
        language?: string;
        voice?: string;
        speed?: number;
    }): Promise<{
        audioContent: Buffer;
        audioUrl: string;
        duration?: number;
    }>;
    /**
     * Generate feedback audio
     */
    generateFeedbackAudio(feedback: string, options?: {
        language?: string;
        voice?: string;
        speed?: number;
    }): Promise<{
        audioContent: Buffer;
        audioUrl: string;
        duration?: number;
    }>;
    /**
     * Get available voices for a language
     */
    getAvailableVoices(languageCode?: string): Promise<any[]>;
    /**
     * Convert multiple texts to speech (batch processing)
     */
    batchSynthesize(requests: TTSRequest[]): Promise<Array<{
        audioContent: Buffer;
        audioUrl: string;
        originalText: string;
    }>>;
    /**
     * Get default voice for a language
     */
    private getDefaultVoice;
    /**
     * Enhance question text for better speech delivery
     */
    private enhanceQuestionText;
    /**
     * Create SSML for feedback delivery
     */
    private createFeedbackSSML;
    /**
     * Clean up old TTS files
     */
    cleanupOldFiles(olderThanHours?: number): Promise<void>;
}
declare const _default: TTSService;
export default _default;
