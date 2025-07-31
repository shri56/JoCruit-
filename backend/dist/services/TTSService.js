"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const text_to_speech_1 = __importDefault(require("@google-cloud/text-to-speech"));
const logger_1 = __importDefault(require("@/utils/logger"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
class TTSService {
    constructor() {
        // Initialize Google Cloud TTS client
        this.client = new text_to_speech_1.default.TextToSpeechClient({
            keyFilename: process.env.GOOGLE_CLOUD_KEY_FILE,
            projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
        });
        // Ensure output directory exists
        this.outputDir = path_1.default.join(process.cwd(), 'uploads', 'audio', 'tts');
        if (!fs_1.default.existsSync(this.outputDir)) {
            fs_1.default.mkdirSync(this.outputDir, { recursive: true });
        }
    }
    /**
     * Convert text to speech and return audio buffer
     */
    async synthesizeSpeech(request) {
        try {
            const { text, language = 'en-US', voice, speed = 1.0 } = request;
            // Configure the synthesis request
            const synthesisRequest = {
                input: { text },
                voice: {
                    languageCode: language,
                    name: voice || this.getDefaultVoice(language),
                    ssmlGender: 'NEUTRAL'
                },
                audioConfig: {
                    audioEncoding: 'MP3',
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
            const audioBuffer = Buffer.from(response.audioContent);
            // Save audio file
            const filename = `tts_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
            const filepath = path_1.default.join(this.outputDir, filename);
            fs_1.default.writeFileSync(filepath, audioBuffer);
            // Calculate approximate duration (rough estimate)
            const wordsPerMinute = 150;
            const wordCount = text.split(' ').length;
            const estimatedDuration = Math.ceil((wordCount / wordsPerMinute) * 60 / speed);
            logger_1.default.info('Text-to-speech synthesis completed', {
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
        }
        catch (error) {
            logger_1.default.error('Error in text-to-speech synthesis:', error);
            throw new Error('Failed to synthesize speech');
        }
    }
    /**
     * Convert text to speech with SSML markup support
     */
    async synthesizeSpeechWithSSML(ssml, options = {}) {
        try {
            const { language = 'en-US', voice, speed = 1.0 } = options;
            const synthesisRequest = {
                input: { ssml },
                voice: {
                    languageCode: language,
                    name: voice || this.getDefaultVoice(language),
                    ssmlGender: 'NEUTRAL'
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate: speed,
                    pitch: 0.0,
                    volumeGainDb: 0.0
                }
            };
            const [response] = await this.client.synthesizeSpeech(synthesisRequest);
            if (!response.audioContent) {
                throw new Error('No audio content received from TTS service');
            }
            const audioBuffer = Buffer.from(response.audioContent);
            // Save audio file
            const filename = `tts_ssml_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.mp3`;
            const filepath = path_1.default.join(this.outputDir, filename);
            fs_1.default.writeFileSync(filepath, audioBuffer);
            logger_1.default.info('SSML text-to-speech synthesis completed', {
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
        }
        catch (error) {
            logger_1.default.error('Error in SSML text-to-speech synthesis:', error);
            throw new Error('Failed to synthesize speech with SSML');
        }
    }
    /**
     * Generate interview question audio
     */
    async generateQuestionAudio(question, options = {}) {
        try {
            // Add some pauses and emphasis for better interview experience
            const enhancedQuestion = this.enhanceQuestionText(question);
            const result = await this.synthesizeSpeech({
                text: enhancedQuestion,
                ...options
            });
            logger_1.default.info('Generated interview question audio', {
                questionLength: question.length,
                enhancedLength: enhancedQuestion.length
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Error generating question audio:', error);
            throw new Error('Failed to generate question audio');
        }
    }
    /**
     * Generate feedback audio
     */
    async generateFeedbackAudio(feedback, options = {}) {
        try {
            // Use SSML for better feedback delivery
            const ssml = this.createFeedbackSSML(feedback);
            const result = await this.synthesizeSpeechWithSSML(ssml, options);
            logger_1.default.info('Generated feedback audio', {
                feedbackLength: feedback.length,
                ssmlLength: ssml.length
            });
            return result;
        }
        catch (error) {
            logger_1.default.error('Error generating feedback audio:', error);
            throw new Error('Failed to generate feedback audio');
        }
    }
    /**
     * Get available voices for a language
     */
    async getAvailableVoices(languageCode = 'en-US') {
        try {
            const [result] = await this.client.listVoices({
                languageCode
            });
            const voices = result.voices || [];
            logger_1.default.info('Retrieved available voices', {
                languageCode,
                voiceCount: voices.length
            });
            return voices.map(voice => ({
                name: voice.name,
                ssmlGender: voice.ssmlGender,
                naturalSampleRateHertz: voice.naturalSampleRateHertz,
                languageCodes: voice.languageCodes
            }));
        }
        catch (error) {
            logger_1.default.error('Error retrieving available voices:', error);
            throw new Error('Failed to retrieve available voices');
        }
    }
    /**
     * Convert multiple texts to speech (batch processing)
     */
    async batchSynthesize(requests) {
        try {
            const results = await Promise.all(requests.map(async (request, index) => {
                const result = await this.synthesizeSpeech(request);
                return {
                    ...result,
                    originalText: request.text
                };
            }));
            logger_1.default.info('Batch TTS synthesis completed', {
                requestCount: requests.length,
                successCount: results.length
            });
            return results;
        }
        catch (error) {
            logger_1.default.error('Error in batch TTS synthesis:', error);
            throw new Error('Failed to complete batch synthesis');
        }
    }
    /**
     * Get default voice for a language
     */
    getDefaultVoice(language) {
        const defaultVoices = {
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
    enhanceQuestionText(question) {
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
    createFeedbackSSML(feedback) {
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
    async cleanupOldFiles(olderThanHours = 24) {
        try {
            const files = fs_1.default.readdirSync(this.outputDir);
            const cutoffTime = Date.now() - (olderThanHours * 60 * 60 * 1000);
            let deletedCount = 0;
            for (const file of files) {
                const filepath = path_1.default.join(this.outputDir, file);
                const stats = fs_1.default.statSync(filepath);
                if (stats.mtime.getTime() < cutoffTime) {
                    fs_1.default.unlinkSync(filepath);
                    deletedCount++;
                }
            }
            logger_1.default.info('TTS files cleanup completed', {
                totalFiles: files.length,
                deletedFiles: deletedCount,
                olderThanHours
            });
        }
        catch (error) {
            logger_1.default.error('Error cleaning up TTS files:', error);
        }
    }
}
exports.default = new TTSService();
//# sourceMappingURL=TTSService.js.map