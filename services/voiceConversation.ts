// Voice Conversation Service - Uses Gemini Live API for real-time voice AI
// This creates an immersive showroom conversation experience

const GEMINI_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

// For demo purposes, we'll use a WebRTC approach with Google's Gemini Live API
// The ideal implementation would use: wss://generativelanguage.googleapis.com/v1alpha/models/gemini-2.5-flash-native-audio:streamGenerateContent

export interface VoiceConversationConfig {
    persona: {
        name: string;
        personality: string;
        language: 'nepali' | 'english' | 'mixed';
        emotionalState: string;
    };
    vehicle: {
        model: string;
        variant: string;
        price: number;
        specs: { label: string; value: string }[];
    };
    context: string;
}

export interface ConversationState {
    isConnected: boolean;
    isListening: boolean;
    isSpeaking: boolean;
    transcript: string;
    aiResponse: string;
    emotions: 'neutral' | 'interested' | 'skeptical' | 'happy' | 'thinking';
}

class GeminiVoiceService {
    private mediaRecorder: MediaRecorder | null = null;
    private audioContext: AudioContext | null = null;
    private stream: MediaStream | null = null;
    private ws: WebSocket | null = null;
    private config: VoiceConversationConfig | null = null;

    public onStateChange: ((state: Partial<ConversationState>) => void) | null = null;
    public onTranscript: ((text: string, isFinal: boolean) => void) | null = null;
    public onAudioResponse: ((audioBlob: Blob) => void) | null = null;

    private state: ConversationState = {
        isConnected: false,
        isListening: false,
        isSpeaking: false,
        transcript: '',
        aiResponse: '',
        emotions: 'neutral'
    };

    async initialize(config: VoiceConversationConfig): Promise<boolean> {
        this.config = config;

        try {
            // Request microphone access
            this.stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    sampleRate: 16000
                }
            });

            this.audioContext = new AudioContext({ sampleRate: 16000 });

            // For demo: Use Web Speech API as fallback since Gemini Live requires server-side auth
            this.setupWebSpeechFallback();

            this.updateState({ isConnected: true });
            return true;
        } catch (error) {
            console.error('Failed to initialize voice service:', error);
            return false;
        }
    }

    private setupWebSpeechFallback() {
        // Use Web Speech API for speech recognition
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = this.config?.persona.language === 'nepali' ? 'ne-NP' : 'en-US';

            recognition.onresult = (event: any) => {
                let transcript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    transcript += event.results[i][0].transcript;
                }
                const isFinal = event.results[event.results.length - 1].isFinal;
                this.onTranscript?.(transcript, isFinal);

                if (isFinal) {
                    this.updateState({ transcript });
                }
            };

            recognition.onerror = (event: any) => {
                console.error('Speech recognition error:', event.error);
                this.updateState({ isListening: false });
            };

            (this as any).recognition = recognition;
        }
    }

    startListening() {
        if ((this as any).recognition) {
            (this as any).recognition.start();
            this.updateState({ isListening: true });
        }
    }

    stopListening() {
        if ((this as any).recognition) {
            (this as any).recognition.stop();
            this.updateState({ isListening: false });
        }
    }

    private updateState(partial: Partial<ConversationState>) {
        this.state = { ...this.state, ...partial };
        this.onStateChange?.(partial);
    }

    disconnect() {
        this.stopListening();
        if (this.stream) {
            this.stream.getTracks().forEach(track => track.stop());
        }
        if (this.ws) {
            this.ws.close();
        }
        this.updateState({ isConnected: false });
    }

    getState(): ConversationState {
        return this.state;
    }
}

// Text-based conversation using OpenRouter (for demo reliability)
export async function generateVoiceResponse(
    userMessage: string,
    config: VoiceConversationConfig,
    conversationHistory: { role: string; content: string }[]
): Promise<{ text: string; emotion: string }> {
    const systemPrompt = buildConversationPrompt(config);

    try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${GEMINI_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AutoSuite Sales Academy'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...conversationHistory.map(m => ({
                        role: m.role === 'user' ? 'user' : 'assistant',
                        content: m.content
                    })),
                    { role: 'user', content: userMessage }
                ],
                max_tokens: 200,
                temperature: 0.9
            })
        });

        if (!response.ok) throw new Error('API error');

        const data = await response.json();
        const text = data.choices[0]?.message?.content || "Hajur, could you repeat that?";

        // Detect emotion from response
        const emotion = detectEmotion(text);

        return { text, emotion };
    } catch (error) {
        console.error('Voice response error:', error);
        return {
            text: "Maaf garnus, I didn't catch that. Can you say it again?",
            emotion: 'neutral'
        };
    }
}

function buildConversationPrompt(config: VoiceConversationConfig): string {
    const langInstruction = config.persona.language === 'nepali'
        ? 'Respond in natural Nepali (नेपाली). Use Devanagari script where appropriate.'
        : config.persona.language === 'mixed'
            ? 'Respond in a natural mix of Nepali and English as spoken in Nepal (code-switching). Use phrases like "hajur", "thik cha", "ke ho" naturally mixed with English.'
            : 'Respond in English but use occasional Nepali greetings.';

    return `You are ${config.persona.name}, a potential car buyer at a Deepal EV showroom in Kathmandu, Nepal.

PERSONALITY: ${config.persona.personality}
EMOTIONAL STATE: ${config.persona.emotionalState}
LANGUAGE: ${langInstruction}

VEHICLE BEING DISCUSSED:
- Model: ${config.vehicle.model} ${config.vehicle.variant}
- Price: NPR ${config.vehicle.price?.toLocaleString() || 'TBD'}
- Specs: ${config.vehicle.specs?.map(s => `${s.label}: ${s.value}`).join(', ')}

CONTEXT: ${config.context}

ROLEPLAY RULES:
1. Speak naturally as if having a real showroom conversation
2. Be a realistic customer - ask questions, show interest, raise concerns
3. React authentically to the salesperson's responses
4. Keep responses SHORT (1-3 sentences) like real conversation
5. Use natural expressions: *nods*, *looks at the car*, *thinks*
6. If the salesperson is convincing, gradually show more interest
7. Feel free to bargain on price - it's expected in Nepal!`;
}

function detectEmotion(text: string): string {
    const lowerText = text.toLowerCase();
    if (lowerText.includes('interesting') || lowerText.includes('nice') || lowerText.includes('ramro')) {
        return 'interested';
    }
    if (lowerText.includes('hmm') || lowerText.includes('think') || lowerText.includes('sochnu')) {
        return 'thinking';
    }
    if (lowerText.includes('!') || lowerText.includes('great') || lowerText.includes('dherai ramro')) {
        return 'happy';
    }
    if (lowerText.includes('but') || lowerText.includes('tara') || lowerText.includes('however')) {
        return 'skeptical';
    }
    return 'neutral';
}

export const voiceService = new GeminiVoiceService();
