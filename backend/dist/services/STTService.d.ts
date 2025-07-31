import { STTRequest } from '@/types';
declare class STTService {
    private client;
    constructor();
    /**
     * Convert speech audio to text
     */
    transcribeAudio(request: STTRequest): Promise<{
        transcription: string;
        confidence: number;
        words?: Array<{
            word: string;
            startTime: number;
            endTime: number;
            confidence: number;
        }>;
        duration?: number;
    }>;
    /**
     * Transcribe audio file from path
     */
    transcribeAudioFile(filePath: string, options?: {
        encoding?: string;
        sampleRateHertz?: number;
        languageCode?: string;
    }): Promise<{
        transcription: string;
        confidence: number;
        words?: Array<{
            word: string;
            startTime: number;
            endTime: number;
            confidence: number;
        }>;
        duration?: number;
    }>;
    /**
     * Long running transcription for longer audio files
     */
    transcribeLongAudio(audioBuffer: Buffer, options?: {
        encoding?: string;
        sampleRateHertz?: number;
        languageCode?: string;
        storageUri?: string;
    }): Promise<{
        transcription: string;
        confidence: number;
        segments: Array<{
            text: string;
            startTime: number;
            endTime: number;
            confidence: number;
        }>;
        duration?: number;
    }>;
    /**
     * Real-time streaming transcription
     */
    createStreamingRecognition(options?: {
        encoding?: string;
        sampleRateHertz?: number;
        languageCode?: string;
        onTranscription?: (transcription: string, isFinal: boolean) => void;
        onError?: (error: Error) => void;
    }): any;
    /**
     * Batch transcribe multiple audio files
     */
    batchTranscribe(audioFiles: Array<{
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
    }>>;
    /**
     * Get supported languages for speech recognition
     */
    getSupportedLanguages(): Promise<string[]>;
    /**
     * Detect encoding from file extension
     */
    private getEncodingFromExtension;
    /**
     * Analyze audio quality and provide recommendations
     */
    analyzeAudioQuality(audioBuffer: Buffer): Promise<{
        quality: 'poor' | 'fair' | 'good' | 'excellent';
        recommendations: string[];
        estimatedAccuracy: number;
    }>;
}
declare const _default: STTService;
export default _default;
