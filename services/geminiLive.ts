/**
 * Gemini 2.5 Flash Live API - Real-time Voice Conversation
 * 
 * This service uses WebSocket to connect to Gemini's Multimodal Live API
 * for real-time, bidirectional voice conversations.
 * 
 * Features:
 * - Real-time audio streaming (user speaks, AI responds with voice)
 * - Native audio generation (not TTS - actual AI-generated speech)
 * - Low latency, natural conversation flow
 * - Supports interruptions and natural turn-taking
 */

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_LIVE_WS_URL = 'wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent';

export interface VoiceSessionConfig {
    persona: {
        name: string;
        personality: string;
        language: 'nepali' | 'english' | 'mixed';
    };
    vehicle: {
        model: string;
        variant: string;
        price: number;
        specs: { label: string; value: string }[];
    };
    systemPrompt?: string;
}

export interface LiveSessionState {
    isConnected: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    error: string | null;
}

type StateCallback = (state: Partial<LiveSessionState>) => void;
type TranscriptCallback = (text: string, isFinal: boolean) => void;
type ResponseCallback = (text: string) => void;

/**
 * Gemini Live Voice Session
 * Manages real-time bidirectional voice conversation with Gemini
 */
export class GeminiLiveSession {
    private ws: WebSocket | null = null;
    private audioContext: AudioContext | null = null;
    private playbackContext: AudioContext | null = null;
    private mediaStream: MediaStream | null = null;
    private processor: ScriptProcessorNode | null = null;
    private audioQueue: Float32Array[] = [];
    private isPlaying = false;
    private config: VoiceSessionConfig | null = null;

    public onStateChange: StateCallback | null = null;
    public onTranscript: TranscriptCallback | null = null;
    public onResponse: ResponseCallback | null = null;

    private state: LiveSessionState = {
        isConnected: false,
        isListening: false,
        isSpeaking: false,
        error: null
    };

    /**
     * Initialize the Gemini Live session
     */
    async connect(config: VoiceSessionConfig): Promise<boolean> {
        this.config = config;

        if (!GEMINI_API_KEY) {
            this.updateState({
                error: 'Gemini API key not configured. Add VITE_GEMINI_API_KEY to .env.local'
            });
            return false;
        }


        try {
            // Request microphone access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 16000,
                    channelCount: 1,
                    echoCancellation: true,
                    noiseSuppression: true,
                }
            });

            // Create audio contexts
            this.audioContext = new AudioContext({ sampleRate: 16000 });
            this.playbackContext = new AudioContext({ sampleRate: 24000 });

            // Connect to Gemini Live API
            const wsUrl = `${GEMINI_LIVE_WS_URL}?key=${GEMINI_API_KEY}`;

            this.ws = new WebSocket(wsUrl);

            this.ws.onopen = () => this.handleWebSocketOpen();
            this.ws.onmessage = (event) => this.handleWebSocketMessage(event);
            this.ws.onerror = (error) => this.handleWebSocketError(error);
            this.ws.onclose = (event) => {
                this.handleWebSocketClose();
            };

            return true;
        } catch (error: any) {
            console.error('Failed to initialize voice session:', error);
            this.updateState({ error: error.message || 'Failed to initialize voice session' });
            return false;
        }
    }

    /**
     * WebSocket opened - send setup message
     */
    private handleWebSocketOpen() {
        const systemPrompt = this.buildSystemPrompt();

        // Send setup message to configure the session
        // Using the correct model name for Gemini Live API
        const setupMessage = {
            setup: {
                model: 'models/gemini-2.0-flash-exp',
                generationConfig: {
                    responseModalities: ['AUDIO', 'TEXT'],
                    speechConfig: {
                        voiceConfig: {
                            prebuiltVoiceConfig: {
                                voiceName: 'Aoede' // Female voice for the customer
                            }
                        }
                    }
                },
                systemInstruction: {
                    parts: [{ text: systemPrompt }]
                }
            }
        };

        this.ws?.send(JSON.stringify(setupMessage));
        this.updateState({ isConnected: true, error: null });
    }

    /**
     * Build system prompt for the customer persona
     */
    private buildSystemPrompt(): string {
        const config = this.config!;
        const langInstruction = config.persona.language === 'nepali'
            ? 'Speak in Nepali (नेपाली). Use natural Nepali speech patterns.'
            : config.persona.language === 'mixed'
                ? 'Speak in a natural mix of Nepali and English as commonly used in urban Nepal. Use phrases like "hajur", "thik cha", "ke ho" mixed with English.'
                : 'Speak in English but use occasional Nepali expressions like "namaste", "hajur", "thik cha".';

        return `You are ${config.persona.name}, a potential car buyer visiting a Deepal EV showroom in Kathmandu, Nepal.

PERSONALITY: ${config.persona.personality}
LANGUAGE: ${langInstruction}

VEHICLE BEING DISCUSSED:
- Model: ${config.vehicle.model} ${config.vehicle.variant}
- Price: NPR ${config.vehicle.price?.toLocaleString() || 'TBD'}
- Key Specs: ${config.vehicle.specs?.slice(0, 4).map(s => `${s.label}: ${s.value}`).join(', ') || 'Premium EV'}

BEHAVIOR:
1. You are a realistic customer - curious, slightly skeptical, price-conscious
2. Keep responses SHORT (1-2 sentences) like natural speech
3. React naturally - ask questions, show interest, raise concerns
4. Feel free to bargain - it's expected in Nepal!
5. If convinced, gradually show more enthusiasm
6. Use natural speech patterns with "hmm", "oh", pauses

Start by greeting the salesperson and mentioning you came to see the ${config.vehicle.model}.`;
    }

    /**
     * Handle incoming WebSocket messages
     */
    private handleWebSocketMessage(event: MessageEvent) {
        try {
            const data = JSON.parse(event.data);

            // Handle setup completion
            if (data.setupComplete) {
                // Send initial greeting to start conversation
                this.sendTextInput('*Customer walks into the showroom looking at the car*');
            }

            // Handle audio data
            if (data.serverContent?.modelTurn?.parts) {
                for (const part of data.serverContent.modelTurn.parts) {
                    // Audio response
                    if (part.inlineData?.mimeType?.includes('audio')) {
                        this.playAudioResponse(part.inlineData.data);
                        this.updateState({ isSpeaking: true });
                    }
                    // Text response (for transcript)
                    if (part.text) {
                        this.onResponse?.(part.text);
                    }
                }
            }

            // Handle turn completion
            if (data.serverContent?.turnComplete) {
                this.updateState({ isSpeaking: false });
            }

            // Handle interruption
            if (data.serverContent?.interrupted) {
                this.stopPlayback();
                this.updateState({ isSpeaking: false });
            }

        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    }

    /**
     * Play audio response from Gemini
     */
    private async playAudioResponse(base64Audio: string) {
        if (!this.playbackContext) return;

        try {
            // Decode base64 to raw bytes
            const binaryString = atob(base64Audio);
            const bytes = new Uint8Array(binaryString.length);
            for (let i = 0; i < binaryString.length; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Convert to Float32 (16-bit PCM to float)
            const samples = new Float32Array(bytes.length / 2);
            const dataView = new DataView(bytes.buffer);
            for (let i = 0; i < samples.length; i++) {
                samples[i] = dataView.getInt16(i * 2, true) / 32768;
            }

            // Create audio buffer and play
            const audioBuffer = this.playbackContext.createBuffer(1, samples.length, 24000);
            audioBuffer.getChannelData(0).set(samples);

            const source = this.playbackContext.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(this.playbackContext.destination);
            source.start();

        } catch (error) {
            console.error('Error playing audio:', error);
        }
    }

    /**
     * Stop audio playback
     */
    private stopPlayback() {
        // Implementation for stopping current playback
        this.audioQueue = [];
        this.isPlaying = false;
    }

    /**
     * Start listening to user's microphone
     */
    startListening() {
        if (!this.audioContext || !this.mediaStream || !this.ws) return;

        const source = this.audioContext.createMediaStreamSource(this.mediaStream);
        this.processor = this.audioContext.createScriptProcessor(4096, 1, 1);

        this.processor.onaudioprocess = (event) => {
            const inputData = event.inputBuffer.getChannelData(0);
            this.sendAudioChunk(inputData);
        };

        source.connect(this.processor);
        this.processor.connect(this.audioContext.destination);

        this.updateState({ isListening: true });
    }

    /**
     * Stop listening
     */
    stopListening() {
        if (this.processor) {
            this.processor.disconnect();
            this.processor = null;
        }
        this.updateState({ isListening: false });
    }

    /**
     * Send audio chunk to Gemini
     */
    private sendAudioChunk(audioData: Float32Array) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        // Convert Float32 to 16-bit PCM
        const pcmData = new Int16Array(audioData.length);
        for (let i = 0; i < audioData.length; i++) {
            pcmData[i] = Math.max(-32768, Math.min(32767, audioData[i] * 32768));
        }

        // Convert to base64
        const uint8Array = new Uint8Array(pcmData.buffer);
        let binary = '';
        for (let i = 0; i < uint8Array.length; i++) {
            binary += String.fromCharCode(uint8Array[i]);
        }
        const base64Audio = btoa(binary);

        // Send realtime input
        const message = {
            realtime_input: {
                media_chunks: [{
                    mime_type: 'audio/pcm;rate=16000',
                    data: base64Audio
                }]
            }
        };

        this.ws.send(JSON.stringify(message));
    }

    /**
     * Send text input (for debugging/fallback)
     */
    sendTextInput(text: string) {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

        const message = {
            client_content: {
                turns: [{
                    role: 'user',
                    parts: [{ text }]
                }],
                turn_complete: true
            }
        };

        this.ws.send(JSON.stringify(message));
    }

    /**
     * Handle WebSocket errors
     */
    private handleWebSocketError(error: Event) {
        console.error('WebSocket error:', error);
        this.updateState({
            error: 'Connection error. Please check your API key and try again.',
            isConnected: false
        });
    }

    /**
     * Handle WebSocket close
     */
    private handleWebSocketClose() {
        this.updateState({ isConnected: false, isListening: false, isSpeaking: false });
    }

    /**
     * Update state and notify callback
     */
    private updateState(partial: Partial<LiveSessionState>) {
        this.state = { ...this.state, ...partial };
        this.onStateChange?.(partial);
    }

    /**
     * Get current state
     */
    getState(): LiveSessionState {
        return this.state;
    }

    /**
     * Disconnect and cleanup
     */
    disconnect() {
        this.stopListening();
        this.stopPlayback();

        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }

        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }

        if (this.audioContext) {
            this.audioContext.close();
            this.audioContext = null;
        }

        if (this.playbackContext) {
            this.playbackContext.close();
            this.playbackContext = null;
        }

        this.updateState({ isConnected: false, isListening: false, isSpeaking: false });
    }
}

// Create singleton instance
export const geminiLive = new GeminiLiveSession();
