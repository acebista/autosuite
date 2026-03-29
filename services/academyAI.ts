// Voice-to-Voice AI Service for Sales Academy
// Uses Web Speech API for STT/TTS and OpenRouter for AI

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// ============ TYPES ============
export interface VehicleData {
    id: string;
    model: string;
    variant: string;
    price: number;
    fuel_type: string;
    specifications: { label: string; value: string }[];
    available_colors?: { name: string; code: string }[];
    image_url?: string;
}

export interface CustomerPersona {
    id: string;
    name: string;
    avatar: string;
    primary_motivation: string;
    emotional_state: string;
    hidden_objection: {
        type: string;
        details: string;
        triggerPhrases: string[];
    };
    communication_style: string;
    patience_level: number;
    technical_knowledge: string;
    typical_phrases: string[];
    difficulty: string;
}

export interface TrainingScenario {
    id: string;
    name: string;
    description: string;
    difficulty: string;
    category: string;
    vehicle_id: string;
    competitor_model?: string;
    customer_context: {
        situation: string;
        knownInfo: string[];
        vehicleInterest: string;
    };
    objectives: {
        primary: string;
        secondary: string[];
    };
    scoring_weights: {
        empathy: number;
        objectionHandling: number;
        closing: number;
    };
    max_turns: number;
    target_duration: number;
}

export interface ChatMessage {
    id: string;
    role: 'user' | 'customer' | 'system';
    content: string;
    timestamp: Date;
    audioUrl?: string;
}

export interface RoleplayContext {
    persona: CustomerPersona;
    scenario: TrainingScenario;
    vehicle: VehicleData;
    messages: ChatMessage[];
    turnCount: number;
    maxTurns: number;
    language: 'ne' | 'en' | 'mixed'; // Nepali, English, or Mixed
}

export interface Scorecard {
    empathy: {
        score: number;
        feedback: string;
        highlights: string[];
        improvements: string[];
    };
    objectionHandling: {
        score: number;
        feedback: string;
        uncoveredHiddenObjection: boolean;
        objectionsAddressed: string[];
    };
    closing: {
        score: number;
        feedback: string;
        attemptedClose: boolean;
        closeType: string;
    };
    overall: number;
    grade: string;
    xpEarned: number;
    keyLearnings: string[];
    languageUsage?: {
        nepaliPercent: number;
        englishPercent: number;
        feedback: string;
    };
}

// ============ VOICE SYNTHESIS (Text-to-Speech) ============
class VoiceSynthesizer {
    private synth: SpeechSynthesis;
    private voices: SpeechSynthesisVoice[] = [];
    private nepaliVoice: SpeechSynthesisVoice | null = null;
    private englishVoice: SpeechSynthesisVoice | null = null;

    constructor() {
        this.synth = window.speechSynthesis;
        this.loadVoices();
    }

    private loadVoices() {
        const setVoices = () => {
            this.voices = this.synth.getVoices();
            // Try to find a Nepali voice (might not be available on all systems)
            this.nepaliVoice = this.voices.find(v => v.lang.includes('ne') || v.lang.includes('hi')) || null;
            // Find a good English voice
            this.englishVoice = this.voices.find(v => v.lang.includes('en-IN') || v.lang.includes('en-GB')) ||
                this.voices.find(v => v.lang.includes('en')) || null;
        };

        if (this.synth.getVoices().length > 0) {
            setVoices();
        } else {
            this.synth.onvoiceschanged = setVoices;
        }
    }

    speak(text: string, language: 'ne' | 'en' | 'mixed' = 'mixed'): Promise<void> {
        return new Promise((resolve, reject) => {
            // Cancel any ongoing speech
            this.synth.cancel();

            const utterance = new SpeechSynthesisUtterance(text);

            // Set voice based on language preference
            if (language === 'ne' && this.nepaliVoice) {
                utterance.voice = this.nepaliVoice;
            } else if (this.englishVoice) {
                utterance.voice = this.englishVoice;
            }

            // Adjust settings for natural speech
            utterance.rate = 0.9;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            utterance.onend = () => resolve();
            utterance.onerror = (e) => reject(e);

            this.synth.speak(utterance);
        });
    }

    stop() {
        this.synth.cancel();
    }

    get isSpeaking() {
        return this.synth.speaking;
    }
}

// ============ VOICE RECOGNITION (Speech-to-Text) ============
class VoiceRecognizer {
    private recognition: any;
    private isListening: boolean = false;
    public onResult: ((text: string, isFinal: boolean) => void) | null = null;
    public onEnd: (() => void) | null = null;
    public onError: ((error: string) => void) | null = null;

    constructor() {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.maxAlternatives = 1;

            // Support Nepali and English
            this.recognition.lang = 'ne-NP'; // Primary: Nepali

            this.setupListeners();
        }
    }

    private setupListeners() {
        if (!this.recognition) return;

        this.recognition.onresult = (event: any) => {
            const result = event.results[event.results.length - 1];
            const transcript = result[0].transcript;
            const isFinal = result.isFinal;

            if (this.onResult) {
                this.onResult(transcript, isFinal);
            }
        };

        this.recognition.onend = () => {
            this.isListening = false;
            if (this.onEnd) {
                this.onEnd();
            }
        };

        this.recognition.onerror = (event: any) => {
            this.isListening = false;
            if (this.onError) {
                this.onError(event.error);
            }
        };
    }

    start(language: 'ne' | 'en' | 'mixed' = 'mixed') {
        if (!this.recognition) {
            this.onError?.('Speech recognition not supported');
            return;
        }

        // Set language based on preference
        if (language === 'ne') {
            this.recognition.lang = 'ne-NP';
        } else if (language === 'en') {
            this.recognition.lang = 'en-US';
        } else {
            // For mixed, default to English but user can speak Nepali
            this.recognition.lang = 'en-US';
        }

        this.isListening = true;
        this.recognition.start();
    }

    stop() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
            this.isListening = false;
        }
    }

    get listening() {
        return this.isListening;
    }

    get isSupported() {
        return !!this.recognition;
    }
}

// ============ AI CUSTOMER SERVICE ============
export async function generateCustomerResponse(context: RoleplayContext): Promise<string> {
    const systemPrompt = buildCustomerSystemPrompt(context);
    const conversationHistory = context.messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'user' ? 'assistant' : 'user',
            content: m.content
        }));

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AutoSuite Sales Academy'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: systemPrompt },
                    ...conversationHistory
                ],
                max_tokens: 300,
                temperature: 0.85,
                top_p: 0.95
            })
        });

        if (!response.ok) {
            console.error('OpenRouter API error:', response.status);
            return getFallbackResponse(context);
        }

        const data = await response.json();
        return data.choices[0]?.message?.content || getFallbackResponse(context);
    } catch (error) {
        console.error('AI generation error:', error);
        return getFallbackResponse(context);
    }
}

function buildCustomerSystemPrompt(context: RoleplayContext): string {
    const { persona, scenario, vehicle } = context;
    const turnsRemaining = context.maxTurns - context.turnCount;

    const languageInstruction = context.language === 'ne'
        ? 'Respond primarily in Nepali (नेपाली). Use Devanagari script. You can mix in some English technical terms when needed.'
        : context.language === 'mixed'
            ? 'Respond in a natural mix of Nepali and English (code-switching), as is common in Nepal. Use phrases like "हजुर", "ठिक छ", "के हो यो?", mixed with English words.'
            : 'Respond in English, but you can use common Nepali phrases like "hajur", "thik cha", etc.';

    return `You are roleplaying as a car customer at a Deepal EV showroom in Nepal. Stay in character.

VERY IMPORTANT - LANGUAGE: ${languageInstruction}

YOUR CHARACTER:
- Name: "${persona.name}"
- Primary Motivation: ${persona.primary_motivation}
- Emotional State: ${persona.emotional_state}
- Communication Style: ${persona.communication_style}
- Patience Level: ${persona.patience_level}/5
- Technical Knowledge: ${persona.technical_knowledge}
- Typical Phrases: ${persona.typical_phrases.join(', ')}

YOUR HIDDEN OBJECTION (reveal gradually if salesperson asks the right questions):
- Type: ${persona.hidden_objection.type}
- Details: ${persona.hidden_objection.details}
- Reveal if they mention: ${persona.hidden_objection.triggerPhrases.join(', ')}

SCENARIO:
- Situation: ${scenario.customer_context.situation}
- What you know: ${scenario.customer_context.knownInfo.join(', ')}
- Vehicle Interest: ${scenario.customer_context.vehicleInterest}

VEHICLE BEING DISCUSSED (Deepal EV):
- Model: ${vehicle.model} ${vehicle.variant}
- Price: NPR ${vehicle.price?.toLocaleString() || 'Check with salesperson'} (रु ${vehicle.price?.toLocaleString() || ''})
- Type: ${vehicle.fuel_type}
- Specs: ${vehicle.specifications?.map(s => `${s.label}: ${s.value}`).join(', ') || 'Ask for details'}

ROLEPLAY RULES:
1. Be a realistic customer - challenging but fair
2. React naturally to the salesperson's pitch
3. If they show empathy, open up gradually
4. If they're pushy, become resistant
5. Use *actions* for body language (e.g., *nods*, *looks skeptical*)
6. Keep responses concise (2-4 sentences)
7. This is turn ${context.turnCount + 1} of ${context.maxTurns}. ${turnsRemaining <= 3 ? 'Start wrapping up - show interest or decline.' : ''}
8. Don't reveal hidden objection unless earned through good questioning`;
}

function getFallbackResponse(context: RoleplayContext): string {
    const responses = [
        `*${context.persona.name} nods* "Hajur, that's interesting. Tara ${context.persona.hidden_objection.type.toLowerCase()} ko barema ke bhannu huncha?"`,
        `"Thik cha, I understand. But what about the ${context.vehicle.model}'s real-world range?"`,
        `*Pauses thoughtfully* "Hmm, okay. And the price - NPR ${context.vehicle.price?.toLocaleString()} - is that negotiable?"`,
        `"I appreciate the information. Can you show me the features practically?"`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
}

// ============ AI SCORECARD GENERATION ============
export async function generateScorecard(context: RoleplayContext): Promise<Scorecard> {
    const systemPrompt = `You are an expert sales trainer analyzing a roleplay session at a Deepal EV showroom in Nepal.

The customer persona had these hidden characteristics:
- Name: "${context.persona.name}"
- Motivation: ${context.persona.primary_motivation}
- Emotional State: ${context.persona.emotional_state}
- HIDDEN OBJECTION: ${context.persona.hidden_objection.type} - ${context.persona.hidden_objection.details}

The scenario objective was: ${context.scenario.objectives.primary}

IMPORTANT: The trainee should use a mix of Nepali and English (code-switching) naturally. Evaluate their language usage.

Analyze the conversation and provide a JSON response:
{
  "empathy": {
    "score": <0-100>,
    "feedback": "<feedback in English>",
    "highlights": ["<positive 1>", "<positive 2>"],
    "improvements": ["<improvement 1>", "<improvement 2>"]
  },
  "objectionHandling": {
    "score": <0-100>,
    "feedback": "<feedback>",
    "uncoveredHiddenObjection": <true/false>,
    "objectionsAddressed": ["<objection 1>"]
  },
  "closing": {
    "score": <0-100>,
    "feedback": "<feedback>",
    "attemptedClose": <true/false>,
    "closeType": "<type or 'None'>"
  },
  "summary": "<2-3 sentences overall assessment>",
  "keyLearnings": ["<learning 1>", "<learning 2>", "<learning 3>"],
  "languageUsage": {
    "nepaliPercent": <0-100>,
    "englishPercent": <0-100>,
    "feedback": "<feedback on natural code-switching>"
  }
}`;

    const conversationText = context.messages
        .filter(m => m.role !== 'system')
        .map(m => `${m.role === 'user' ? 'SALESPERSON' : 'CUSTOMER'}: ${m.content}`)
        .join('\n');

    try {
        const response = await fetch(OPENROUTER_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'HTTP-Referer': window.location.origin,
                'X-Title': 'AutoSuite Sales Academy'
            },
            body: JSON.stringify({
                model: 'google/gemini-2.0-flash-001',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: `Analyze this roleplay:\n\n${conversationText}` }
                ],
                max_tokens: 1000,
                temperature: 0.3
            })
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const content = data.choices[0]?.message?.content;

        if (content) {
            try {
                const cleanContent = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                const parsed = JSON.parse(cleanContent);

                // Calculate overall score
                const weights = context.scenario.scoring_weights || { empathy: 30, objectionHandling: 40, closing: 30 };
                const overall = Math.round(
                    (parsed.empathy.score * weights.empathy +
                        parsed.objectionHandling.score * weights.objectionHandling +
                        parsed.closing.score * weights.closing) / 100
                );

                // Calculate grade and XP
                let grade = 'C';
                if (overall >= 90) grade = 'A';
                else if (overall >= 80) grade = 'B';
                else if (overall >= 70) grade = 'C';
                else if (overall >= 60) grade = 'D';
                else grade = 'F';

                const baseXP = 50;
                const difficultyMultiplier = context.scenario.difficulty === 'Pro' ? 2 : 1;
                const xpEarned = Math.round((baseXP + overall + (parsed.objectionHandling.uncoveredHiddenObjection ? 25 : 0)) * difficultyMultiplier);

                return {
                    ...parsed,
                    overall,
                    grade,
                    xpEarned
                };
            } catch (parseError) {
                console.error('Failed to parse scorecard:', parseError);
            }
        }
    } catch (error) {
        console.error('Scorecard generation error:', error);
    }

    // Return fallback scorecard
    return getDefaultScorecard(context);
}

function getDefaultScorecard(context: RoleplayContext): Scorecard {
    return {
        empathy: {
            score: 70,
            feedback: 'Good effort in building rapport with the customer.',
            highlights: ['Maintained professional tone'],
            improvements: ['Ask more probing questions']
        },
        objectionHandling: {
            score: 65,
            feedback: 'Some objections were addressed. Keep practicing!',
            uncoveredHiddenObjection: false,
            objectionsAddressed: ['General concerns']
        },
        closing: {
            score: 60,
            feedback: 'Continue working on closing techniques.',
            attemptedClose: false,
            closeType: 'None'
        },
        overall: 65,
        grade: 'C',
        xpEarned: context.scenario.difficulty === 'Pro' ? 180 : 90,
        keyLearnings: [
            'Focus on discovering the hidden objection',
            'Practice assertive closing techniques',
            'Use empathetic language to build trust'
        ],
        languageUsage: {
            nepaliPercent: 30,
            englishPercent: 70,
            feedback: 'Try to use more Nepali naturally in conversation for better customer connection.'
        }
    };
}

// ============ OPENING LINE GENERATOR ============
export function generateOpeningLine(persona: CustomerPersona, vehicle: VehicleData, language: 'ne' | 'en' | 'mixed' = 'mixed'): string {
    const openings: Record<string, Record<string, string>> = {
        'Skeptical': {
            'ne': `*${persona.name} आउनुहुन्छ, हात बाँधेर* "म EV बारेमा धेरै research गरेको छु। यो ${vehicle.model} किन राम्रो हो भन्नुस् त?"`,
            'en': `*${persona.name} walks in, arms crossed* "I've been researching EVs for weeks. What makes the ${vehicle.model} worth my time?"`,
            'mixed': `*${persona.name} आउनुहुन्छ* "Hajur, म EV हेर्दै छु। Yesto ${vehicle.model} ko barema bhannus na, ke special cha?"`,
        },
        'Excited': {
            'ne': `*${persona.name} उत्साहित हुँदै आउनुहुन्छ* "वाह! यो ${vehicle.model} त Online मा हेरेकी थिएँ। Finally देख्न पाएँ!"`,
            'en': `*${persona.name} approaches eagerly* "I've seen the ${vehicle.model} online and I'm really excited! Can you tell me more?"`,
            'mixed': `*${persona.name} खुसी हुँदै* "Hello! Yo ${vehicle.model} ta dherai ramro lagyo online ma. Finally showroom ma aaiye!"`,
        },
        'Frustrated': {
            'ne': `*${persona.name} खिस्सिएको देखिन्छ* "हेर्नुस्, म पहिले अरू dealership गएथें, खराब experience भयो। सिधा कुरा गर्नुस्।"`,
            'en': `*${persona.name} looks irritated* "Look, I've had bad experiences with dealerships. Just give me the honest facts about the ${vehicle.model}."`,
            'mixed': `*${persona.name} थोरै frustrated देखिन्छ* "Hajur, ma aru showroom bata frustrated chu. Sidhai bhannus ${vehicle.model} ko barema."`,
        },
        'Anxious': {
            'ne': `*${persona.name} अलि nervous देखिन्छ* "नमस्ते... म ${vehicle.model} हेर्न आएको। Mero pahilo EV hune ho..."`,
            'en': `*${persona.name} seems nervous* "Hi... I'm looking at the ${vehicle.model}. This would be my first EV, so I have many questions..."`,
            'mixed': `*${persona.name} थोरै anxious* "Namaste, hajur. Yo ${vehicle.model} hernu thiyo. First time EV kinna khojeko, ali doubt cha..."`,
        },
        'Indifferent': {
            'ne': `*${persona.name} ले ${vehicle.model} हेर्छ* "मेरो husband/wife ले पठाउनुभयो। के special cha यो गाडीमा?"`,
            'en': `*${persona.name} glances at the ${vehicle.model}* "My spouse wanted me to check this out. What's special about it?"`,
            'mixed': `*${persona.name} casually herchha* "Hajur, mero family le pathako. Yo ${vehicle.model} ma ke cha special?"`,
        },
        'Aggressive': {
            'ne': `*${persona.name} छिटो आउनुहुन्छ* "मसँग समय छैन। ${vehicle.model} को best price के हो? Direct भन्नुहोस्।"`,
            'en': `*${persona.name} marches in* "I don't have much time. What's your best price on the ${vehicle.model}? No runaround."`,
            'mixed': `*${persona.name} confidently aunchha* "Time xaina dherai. ${vehicle.model} ko last price k ho? Sidhai bhannus."`,
        }
    };

    const state = persona.emotional_state || 'Skeptical';
    return openings[state]?.[language] || openings[state]?.['mixed'] || openings['Skeptical']['mixed'];
}

// ============ EXPORTS ============
export const voiceSynthesizer = new VoiceSynthesizer();
export const voiceRecognizer = new VoiceRecognizer();
