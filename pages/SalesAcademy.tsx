import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PageHeader, Card, Button, Badge, useToast, Skeleton, Modal } from '../UI';
import {
    GraduationCap, BookOpen, Map, Mic, MicOff, Phone, PhoneOff,
    ArrowRight, ArrowLeft, CheckCircle2, Sparkles, Users, Car,
    Volume2, VolumeX, Clock, Zap, ChevronRight, Eye, Target, Award, Wifi, WifiOff
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../api';
import { generateVoiceResponse, type VoiceConversationConfig } from '../services/voiceConversation';
import { geminiLive, type VoiceSessionConfig, type LiveSessionState } from '../services/geminiLive';

// ============ TYPES ============
interface Vehicle {
    id: string;
    model: string;
    variant: string;
    price: number;
    fuel_type: string;
    specifications: { label: string; value: string }[];
    image_url?: string;
}

interface ChatMessage {
    id: string;
    role: 'user' | 'customer';
    content: string;
    timestamp: Date;
}

type AcademyView = 'home' | 'playbook' | 'protocol' | 'simulator';

// ============ VOICE HOOK ============
const useSpeechRecognition = () => {
    const [isListening, setIsListening] = useState(false);
    const [transcript, setTranscript] = useState('');
    const [isSupported, setIsSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    useEffect(() => {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
            setIsSupported(true);
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event: any) => {
                let finalTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; i++) {
                    if (event.results[i].isFinal) {
                        finalTranscript += event.results[i][0].transcript;
                    }
                }
                if (finalTranscript) {
                    setTranscript(prev => prev + ' ' + finalTranscript);
                }
            };

            recognitionRef.current.onerror = () => setIsListening(false);
            recognitionRef.current.onend = () => setIsListening(false);
        }
    }, []);

    const startListening = useCallback(() => {
        if (recognitionRef.current && !isListening) {
            setTranscript('');
            recognitionRef.current.start();
            setIsListening(true);
        }
    }, [isListening]);

    const stopListening = useCallback(() => {
        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    }, [isListening]);

    const resetTranscript = useCallback(() => setTranscript(''), []);

    return { isListening, transcript, isSupported, startListening, stopListening, resetTranscript, setTranscript };
};

// ============ MAIN COMPONENT ============
const SalesAcademy: React.FC = () => {
    const { showToast } = useToast();
    const [view, setView] = useState<AcademyView>('home');

    // Simulator state - simplified
    const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [isCallActive, setIsCallActive] = useState(false);
    const [isAIThinking, setIsAIThinking] = useState(false);
    const [customerEmotion, setCustomerEmotion] = useState<'neutral' | 'interested' | 'skeptical' | 'happy' | 'thinking'>('neutral');

    // Voice
    const { isListening, transcript, isSupported, startListening, stopListening, resetTranscript, setTranscript } = useSpeechRecognition();
    const [inputText, setInputText] = useState('');
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Modal states
    const [specsModalOpen, setSpecsModalOpen] = useState(false);
    const [battlecardModalOpen, setBattlecardModalOpen] = useState(false);
    const [selectedModalVehicle, setSelectedModalVehicle] = useState<Vehicle | null>(null);

    // Gemini Live Voice Session
    const [voiceMode, setVoiceMode] = useState<'text' | 'live'>('text');
    const [liveSession, setLiveSession] = useState<LiveSessionState>({
        isConnected: false,
        isListening: false,
        isSpeaking: false,
        error: null
    });

    // Setup Gemini Live callbacks
    useEffect(() => {
        geminiLive.onStateChange = (state) => {
            setLiveSession(prev => ({ ...prev, ...state }));
        };

        geminiLive.onResponse = (text) => {
            // Add AI response to messages
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'customer',
                content: text,
                timestamp: new Date()
            }]);
        };

        return () => {
            geminiLive.disconnect();
        };
    }, []);

    // Fetch vehicles
    const { data: vehicles = [], isLoading: loadingVehicles } = useQuery({
        queryKey: ['vehicles'],
        queryFn: async () => {
            const { data, error } = await supabase.from('vehicles').select('*').order('model');
            if (error) throw error;
            // Map the data to ensure specifications is properly typed
            return (data || []).map(v => ({
                ...v,
                specifications: (v.specifications as unknown as { label: string; value: string }[]) || []
            })) as Vehicle[];
        }
    });

    // Sync transcript to input
    useEffect(() => {
        if (transcript.trim()) {
            setInputText(transcript.trim());
        }
    }, [transcript]);

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    // Start conversation with selected vehicle
    const startConversation = async (vehicle: Vehicle, mode: 'text' | 'live' = 'text') => {
        setSelectedVehicle(vehicle);
        setIsCallActive(true);
        setMessages([]);
        setVoiceMode(mode);

        if (mode === 'live') {
            // Start Gemini Live voice session
            const config: VoiceSessionConfig = {
                persona: {
                    name: 'Sita Sharma',
                    personality: 'Curious but price-conscious professional looking for a reliable EV.',
                    language: 'mixed'
                },
                vehicle: {
                    model: vehicle.model,
                    variant: vehicle.variant,
                    price: vehicle.price,
                    specs: vehicle.specifications || []
                }
            };

            const connected = await geminiLive.connect(config);
            if (!connected) {
                showToast('Could not connect to voice service. Using text mode.', 'warning');
                setVoiceMode('text');
                // Fall back to text mode
                startTextConversation(vehicle);
            }
        } else {
            startTextConversation(vehicle);
        }
    };

    // Start text-based conversation
    const startTextConversation = (vehicle: Vehicle) => {
        setTimeout(() => {
            const openingLines = [
                `*आउनुहुन्छ showroom मा* Namaste! Yo ${vehicle.model} hernu thiyo. Online ma dherai ramro lagyo.`,
                `*enters showroom* Hello, I saw the ${vehicle.model} online. Is this the ${vehicle.variant}?`,
                `*looks at the car* Hajur, yo ${vehicle.model} ko price kati ho? Specs ramro dekhiyo.`,
            ];

            setMessages([{
                id: '1',
                role: 'customer',
                content: openingLines[Math.floor(Math.random() * openingLines.length)],
                timestamp: new Date()
            }]);
            setCustomerEmotion('interested');
        }, 1000);
    };

    // Toggle live voice listening
    const toggleLiveListening = () => {
        if (liveSession.isListening) {
            geminiLive.stopListening();
        } else {
            geminiLive.startListening();
        }
    };

    // Send message
    const sendMessage = async () => {
        if (!inputText.trim() || !selectedVehicle || isAIThinking) return;

        const userMessage: ChatMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: inputText,
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputText('');
        resetTranscript();
        setIsAIThinking(true);
        setCustomerEmotion('thinking');

        try {
            const config: VoiceConversationConfig = {
                persona: {
                    name: 'Sita Sharma',
                    personality: 'Curious but price-conscious professional. Looking for a reliable EV for daily commute.',
                    language: 'mixed',
                    emotionalState: 'interested'
                },
                vehicle: {
                    model: selectedVehicle.model,
                    variant: selectedVehicle.variant,
                    price: selectedVehicle.price,
                    specs: selectedVehicle.specifications || []
                },
                context: 'Customer walked into the showroom after seeing the car online. Interested but needs convincing on value.'
            };

            const conversationHistory = messages.map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
            }));

            const { text, emotion } = await generateVoiceResponse(inputText, config, conversationHistory);

            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'customer',
                content: text,
                timestamp: new Date()
            }]);

            setCustomerEmotion(emotion as any);
        } catch (error) {
            console.error('AI error:', error);
            setMessages(prev => [...prev, {
                id: (Date.now() + 1).toString(),
                role: 'customer',
                content: "*pauses* Hajur, maaf garnus, feri bhannus na?",
                timestamp: new Date()
            }]);
            setCustomerEmotion('neutral');
        } finally {
            setIsAIThinking(false);
        }
    };

    // End call
    const endCall = () => {
        if (voiceMode === 'live') {
            geminiLive.disconnect();
        }
        setIsCallActive(false);
        setVoiceMode('text');
        showToast('Conversation ended. Great practice!', 'success');
    };

    // ============ RENDER: HOME ============
    const renderHome = () => (
        <div className="space-y-8">
            <div className="text-center mb-12">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-100 to-orange-100 rounded-full mb-4">
                    <GraduationCap className="w-5 h-5 text-amber-600" />
                    <span className="text-sm font-semibold text-amber-700">Sales Academy</span>
                </div>
                <h1 className="text-4xl font-display font-bold text-surface-900 mb-3">Master the Art of Selling</h1>
                <p className="text-lg text-surface-600 max-w-2xl mx-auto">
                    Learn the products, follow the protocol, and practice with AI customers
                </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
                {/* Digital Playbook */}
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-blue-200" onClick={() => setView('playbook')}>
                    <div className="p-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <BookOpen className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-surface-900 mb-2">Digital Playbook</h3>
                        <p className="text-surface-600 text-sm mb-4">
                            Master every Deepal vehicle's specs, features, and selling points.
                        </p>
                        <div className="flex items-center gap-2 text-blue-600 font-semibold text-sm">
                            <span>Explore Vehicles</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Card>

                {/* Sales Protocol */}
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-emerald-200" onClick={() => setView('protocol')}>
                    <div className="p-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Map className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-surface-900 mb-2">Sales Protocol</h3>
                        <p className="text-surface-600 text-sm mb-4">
                            Step-by-step guide from greeting to closing the deal.
                        </p>
                        <div className="flex items-center gap-2 text-emerald-600 font-semibold text-sm">
                            <span>View Protocol</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Card>

                {/* Showroom Simulator */}
                <Card className="group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 border-transparent hover:border-purple-200 relative overflow-hidden" onClick={() => setView('simulator')}>
                    <div className="absolute top-3 right-3">
                        <Badge variant="success" className="animate-pulse">AI-Powered</Badge>
                    </div>
                    <div className="p-6">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Mic className="w-7 h-7 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-surface-900 mb-2">Showroom Simulator</h3>
                        <p className="text-surface-600 text-sm mb-4">
                            Talk to AI customers. Convince them to buy.
                        </p>
                        <div className="flex items-center gap-2 text-purple-600 font-semibold text-sm">
                            <span>Start Conversation</span>
                            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );

    // ============ RENDER: PLAYBOOK ============
    const renderPlaybook = () => (
        <div className="max-w-5xl mx-auto">
            <div className="mb-8">
                <Button variant="ghost" onClick={() => setView('home')} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Academy
                </Button>
                <h2 className="text-2xl font-bold text-surface-900">Digital Playbook</h2>
                <p className="text-surface-600">Master every Deepal EV - know the specs, features, and competitive advantages</p>
            </div>

            {loadingVehicles ? (
                <div className="grid md:grid-cols-2 gap-6">
                    <Skeleton className="h-96" />
                    <Skeleton className="h-96" />
                </div>
            ) : (
                <div className="grid md:grid-cols-2 gap-6">
                    {vehicles.map(vehicle => (
                        <Card key={vehicle.id} className="overflow-hidden hover:shadow-xl transition-all">
                            <div className="aspect-video bg-gradient-to-br from-deepal-100 to-surface-200 relative flex items-center justify-center">
                                <Car className="w-20 h-20 text-deepal-300" />
                                <Badge variant="blue" className="absolute top-3 right-3">{vehicle.fuel_type}</Badge>
                            </div>
                            <div className="p-5">
                                <h3 className="font-bold text-xl text-surface-900 mb-1">{vehicle.model} {vehicle.variant}</h3>
                                <p className="text-lg font-semibold text-deepal-600 mb-4">NPR {(vehicle.price / 100000).toFixed(1)} Lakhs</p>

                                {/* Quick Specs */}
                                <div className="grid grid-cols-2 gap-2 mb-4">
                                    {vehicle.specifications?.slice(0, 4).map((spec, i) => (
                                        <div key={i} className="bg-surface-50 rounded-lg p-2 text-center">
                                            <p className="text-xs text-surface-500 truncate">{spec.label}</p>
                                            <p className="text-sm font-semibold text-surface-800 truncate">{spec.value}</p>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => { setSelectedModalVehicle(vehicle); setSpecsModalOpen(true); }}
                                    >
                                        <Eye className="w-4 h-4 mr-1" /> Full Specs
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="gradient"
                                        className="flex-1"
                                        onClick={() => { setSelectedModalVehicle(vehicle); setBattlecardModalOpen(true); }}
                                    >
                                        <Target className="w-4 h-4 mr-1" /> Battlecard
                                    </Button>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Specs Modal */}
            <Modal isOpen={specsModalOpen} onClose={() => setSpecsModalOpen(false)} title={`${selectedModalVehicle?.model} ${selectedModalVehicle?.variant} - Specifications`} size="lg">
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        {selectedModalVehicle?.specifications?.map((spec, i) => (
                            <div key={i} className="p-3 bg-surface-50 rounded-xl">
                                <p className="text-xs text-surface-500 mb-1">{spec.label}</p>
                                <p className="font-semibold text-surface-900">{spec.value}</p>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-deepal-50 rounded-xl border border-deepal-200">
                        <h4 className="font-bold text-deepal-700 mb-2">💡 Sales Tip</h4>
                        <p className="text-sm text-deepal-600">
                            Focus on how these specs translate to real-world benefits. For example, "{selectedModalVehicle?.specifications?.[0]?.value}" means excellent performance for daily city drives and highway confidence.
                        </p>
                    </div>
                </div>
            </Modal>

            {/* Battlecard Modal */}
            <Modal isOpen={battlecardModalOpen} onClose={() => setBattlecardModalOpen(false)} title={`${selectedModalVehicle?.model} - Battlecard`} size="lg">
                <div className="space-y-4">
                    {/* Key Selling Points */}
                    <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200">
                        <h4 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" /> Key Selling Points
                        </h4>
                        <ul className="space-y-2 text-sm text-amber-900">
                            {selectedModalVehicle?.model.includes('E07') && (
                                <>
                                    <li>✓ <strong>Fastest SUV:</strong> 0-100 km/h in just 3.96 seconds</li>
                                    <li>✓ <strong>Longest Range:</strong> Up to 620 km CLTC - no range anxiety</li>
                                    <li>✓ <strong>Unique Design:</strong> Hidden door handles, panoramic sunroof</li>
                                    <li>✓ <strong>Premium Interior:</strong> Zero-gravity seats, NVH optimization</li>
                                </>
                            )}
                            {selectedModalVehicle?.model.includes('L07') && (
                                <>
                                    <li>✓ <strong>Executive Sedan:</strong> Premium comfort for professionals</li>
                                    <li>✓ <strong>Range Options:</strong> Pure EV or EREV for flexibility</li>
                                    <li>✓ <strong>Smart Features:</strong> L2+ autonomous driving capability</li>
                                    <li>✓ <strong>Quiet Luxury:</strong> Library-silent cabin at highway speeds</li>
                                </>
                            )}
                            {selectedModalVehicle?.model.includes('S05') && (
                                <>
                                    <li>✓ <strong>Best Value:</strong> Most affordable Deepal EV in Nepal</li>
                                    <li>✓ <strong>City Perfect:</strong> Compact size, 420 km range</li>
                                    <li>✓ <strong>Smart Parking:</strong> Remote park-in/park-out</li>
                                    <li>✓ <strong>Low TCO:</strong> EV savings on fuel and maintenance</li>
                                </>
                            )}
                            {selectedModalVehicle?.model.includes('S07') && (
                                <>
                                    <li>✓ <strong>Family SUV:</strong> Spacious for up to 7 passengers</li>
                                    <li>✓ <strong>Great Range:</strong> 520-620 km depending on variant</li>
                                    <li>✓ <strong>Premium Features:</strong> At mid-range price point</li>
                                    <li>✓ <strong>High Ground:</strong> 190mm clearance for Nepal roads</li>
                                </>
                            )}
                        </ul>
                    </div>

                    {/* Common Objections */}
                    <div className="p-4 bg-gradient-to-r from-red-50 to-pink-50 rounded-xl border border-red-200">
                        <h4 className="font-bold text-red-800 mb-3">⚡ Common Objections & Responses</h4>
                        <div className="space-y-3 text-sm">
                            <div className="p-2 bg-white/70 rounded-lg">
                                <p className="font-medium text-red-700">"Range anxiety - What if battery dies?"</p>
                                <p className="text-red-600 mt-1">→ "With {selectedModalVehicle?.specifications?.find(s => s.label.includes('Range'))?.value || '500+'} km range, you can drive Kathmandu to Pokhara and back on a single charge. Plus, home charging is super convenient."</p>
                            </div>
                            <div className="p-2 bg-white/70 rounded-lg">
                                <p className="font-medium text-red-700">"Chinese brand - Quality concerns"</p>
                                <p className="text-red-600 mt-1">→ "Deepal is backed by Changan, a 160-year-old company. They're one of China's top 4 automakers with JV experience with Ford, Mazda, and Suzuki."</p>
                            </div>
                            <div className="p-2 bg-white/70 rounded-lg">
                                <p className="font-medium text-red-700">"Price is too high"</p>
                                <p className="text-red-600 mt-1">→ "Let's calculate your 5-year TCO. With zero fuel cost and 70% lower maintenance, the {selectedModalVehicle?.model} actually saves you NPR 15-20 lakhs over its lifetime."</p>
                            </div>
                        </div>
                    </div>

                    {/* Competitor Comparison */}
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                        <h4 className="font-bold text-blue-800 mb-3">📊 vs. Competitors</h4>
                        <p className="text-sm text-blue-700">
                            Compared to BYD, Hyundai, and other EVs in this segment, the {selectedModalVehicle?.model} offers
                            <strong> better range, faster acceleration, and more features</strong> at a competitive price point.
                        </p>
                    </div>
                </div>
            </Modal>
        </div>
    );

    // ============ RENDER: PROTOCOL ============
    const renderProtocol = () => (
        <div className="max-w-4xl mx-auto">
            <div className="mb-8">
                <Button variant="ghost" onClick={() => setView('home')} className="mb-4">
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Academy
                </Button>
                <h2 className="text-2xl font-bold text-surface-900">Sales Protocol</h2>
                <p className="text-surface-600">Your complete roadmap from greeting to closing</p>
            </div>

            <div className="space-y-6">
                {[
                    {
                        step: 1,
                        name: 'The Greeting',
                        icon: Users,
                        duration: '2-3 min',
                        description: 'Make a great first impression. Build rapport immediately.',
                        keyActions: [
                            'Smile and make eye contact',
                            'Introduce yourself by name',
                            'Offer water/tea/coffee',
                            'Ask how they heard about Deepal'
                        ],
                        scripts: [
                            '"Namaste! Welcome to Deepal. I\'m [Name]. Is this your first time seeing our EVs in person?"',
                            '"Hajur, please have a seat. Can I get you some water while we talk?"'
                        ],
                        tips: 'Don\'t jump into selling! First 3 minutes are about building trust.'
                    },
                    {
                        step: 2,
                        name: 'Discovery',
                        icon: Sparkles,
                        duration: '5-10 min',
                        description: 'Understand their needs, lifestyle, and buying motivation.',
                        keyActions: [
                            'Ask open-ended questions',
                            'Listen more than you talk (80/20 rule)',
                            'Take mental notes on key priorities',
                            'Identify the decision maker'
                        ],
                        scripts: [
                            '"What brings you to look at EVs today?"',
                            '"How do you primarily use your current car?"',
                            '"Who else will be driving this car?"',
                            '"What features matter most to you?"'
                        ],
                        tips: 'The customer reveals their objections during discovery. Listen carefully!'
                    },
                    {
                        step: 3,
                        name: 'Presentation',
                        icon: Car,
                        duration: '10-15 min',
                        description: 'Match vehicle features to their specific needs.',
                        keyActions: [
                            'Walk around the car together',
                            'Connect each feature to their lifestyle',
                            'Let them touch, sit, experience',
                            'Focus on benefits, not just specs'
                        ],
                        scripts: [
                            '"You mentioned long drives - this 620km range means Kathmandu to Pokhara with charge to spare."',
                            '"Since your wife will also drive, notice how easy the remote parking is..."',
                            '"Feel how quiet the cabin is - perfect for those work calls during your commute."'
                        ],
                        tips: 'Use the Digital Playbook to memorize battlecards. Know your product inside out.'
                    },
                    {
                        step: 4,
                        name: 'Test Drive',
                        icon: Zap,
                        duration: '15-20 min',
                        description: 'Let the car sell itself. Create the emotional connection.',
                        keyActions: [
                            'Pre-plan a route that shows off the car',
                            'Let them drive their usual conditions',
                            'Point out features as they experience them',
                            'Stay quiet during key moments - let them feel it'
                        ],
                        scripts: [
                            '"Feel that instant torque? That\'s 255 horsepower at your fingertips."',
                            '"Notice how the suspension absorbs these potholes - designed for Nepal roads."',
                            '"How does it compare to what you\'re driving now?"'
                        ],
                        tips: 'Always ask "How does it feel?" after the test drive. Their face will tell you everything.'
                    },
                    {
                        step: 5,
                        name: 'Handle Objections',
                        icon: Target,
                        duration: '5-10 min',
                        description: 'Address concerns with empathy and evidence.',
                        keyActions: [
                            'Acknowledge the concern genuinely',
                            'Ask clarifying questions',
                            'Provide specific evidence/examples',
                            'Confirm the concern is resolved'
                        ],
                        scripts: [
                            '"I understand that concern. Many customers initially worried about range, but once they see...',
                            '"That\'s a fair point about price. Let me show you the 5-year cost comparison...',
                            '"You\'re right to ask about service. Our warranty is 8 years on battery, and here\'s our nearest service center..."'
                        ],
                        tips: 'Never argue. Use "Feel, Felt, Found" technique: "I understand how you feel. Other customers felt the same. What they found was..."'
                    },
                    {
                        step: 6,
                        name: 'The Close',
                        icon: Award,
                        duration: '5-10 min',
                        description: 'Guide them to the decision. Ask for the sale.',
                        keyActions: [
                            'Summarize the value proposition',
                            'Create gentle urgency (if genuine)',
                            'Offer financing/exchange options',
                            'Ask for the commitment directly'
                        ],
                        scripts: [
                            '"Based on everything we discussed, the S07 seems perfect for your family. Shall we start the paperwork?"',
                            '"We have one unit in the color you wanted. Would you like to secure it with a booking?"',
                            '"What would it take for you to drive home in this car today?"'
                        ],
                        tips: 'The worst thing you can do is not ask for the sale. Be confident but not pushy.'
                    },
                ].map((phase) => (
                    <Card key={phase.step} className="overflow-hidden">
                        <div className="flex items-start gap-4 p-6">
                            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-deepal-500 to-accent-teal flex items-center justify-center flex-shrink-0">
                                <phase.icon className="w-7 h-7 text-white" />
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-xs font-bold text-deepal-500 bg-deepal-50 px-2 py-1 rounded-full">STEP {phase.step}</span>
                                    <span className="text-xs text-surface-500 flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> {phase.duration}
                                    </span>
                                </div>
                                <h3 className="font-bold text-xl text-surface-900 mb-2">{phase.name}</h3>
                                <p className="text-surface-600 mb-4">{phase.description}</p>

                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
                                        <h4 className="font-semibold text-emerald-800 text-sm mb-2">✓ Key Actions</h4>
                                        <ul className="space-y-1 text-sm text-emerald-700">
                                            {phase.keyActions.map((action, i) => (
                                                <li key={i}>• {action}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                                        <h4 className="font-semibold text-blue-800 text-sm mb-2">💬 Sample Scripts</h4>
                                        <ul className="space-y-2 text-sm text-blue-700 italic">
                                            {phase.scripts.map((script, i) => (
                                                <li key={i}>{script}</li>
                                            ))}
                                        </ul>
                                    </div>
                                </div>

                                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3">
                                    <p className="text-sm text-amber-800">
                                        <strong>💡 Pro Tip:</strong> {phase.tips}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );

    // ============ RENDER: SIMULATOR ============
    const renderSimulator = () => {
        // Vehicle selection
        if (!isCallActive) {
            return (
                <div className="max-w-4xl mx-auto">
                    <div className="mb-8">
                        <Button variant="ghost" onClick={() => setView('home')} className="mb-4">
                            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Academy
                        </Button>
                        <h2 className="text-2xl font-bold text-surface-900">Showroom Simulator</h2>
                        <p className="text-surface-600">Select a vehicle and choose your conversation mode</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {loadingVehicles ? (
                            <Skeleton className="h-40" />
                        ) : (
                            vehicles.map(vehicle => (
                                <Card
                                    key={vehicle.id}
                                    className="p-5 hover:shadow-lg hover:border-purple-300 transition-all"
                                >
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center">
                                            <Car className="w-6 h-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-surface-900">{vehicle.model}</h3>
                                            <p className="text-sm text-surface-500">{vehicle.variant}</p>
                                        </div>
                                    </div>
                                    <p className="text-lg font-semibold text-deepal-600 mb-4">
                                        NPR {(vehicle.price / 100000).toFixed(1)} Lakhs
                                    </p>

                                    <div className="space-y-2">
                                        {/* Live Voice Button */}
                                        <Button
                                            size="sm"
                                            variant="gradient"
                                            className="w-full"
                                            onClick={() => startConversation(vehicle, 'live')}
                                        >
                                            <Mic className="w-4 h-4 mr-2" /> Voice Conversation
                                        </Button>

                                        {/* Text Mode Button */}
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            className="w-full"
                                            onClick={() => startConversation(vehicle, 'text')}
                                        >
                                            <ArrowRight className="w-4 h-4 mr-2" /> Text Mode
                                        </Button>
                                    </div>
                                </Card>
                            ))
                        )}
                    </div>

                    {/* Info about voice mode */}
                    <Card className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
                        <div className="flex items-start gap-3">
                            <Mic className="w-6 h-6 text-purple-600 flex-shrink-0 mt-1" />
                            <div>
                                <h4 className="font-bold text-purple-900">Voice Conversation Mode</h4>
                                <p className="text-sm text-purple-700">
                                    Uses Gemini 2.5 Flash Native Audio for natural, real-time voice conversations.
                                    The AI customer will speak to you directly - no text-to-speech!
                                </p>
                                {!import.meta.env.VITE_GEMINI_API_KEY && (
                                    <p className="text-xs text-purple-500 mt-2">
                                        ⚠️ Add your Gemini API key to .env.local for voice mode
                                    </p>
                                )}
                            </div>
                        </div>
                    </Card>
                </div>
            );
        }

        // Active conversation - Voice Mode
        if (voiceMode === 'live') {
            return (
                <div className="max-w-2xl mx-auto">
                    {/* Customer Avatar - Large and Central */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="relative mb-4">
                            <div className={`w-48 h-48 rounded-full overflow-hidden border-4 ${liveSession.isSpeaking ? 'border-green-500 animate-pulse' :
                                liveSession.isListening ? 'border-purple-500' :
                                    'border-white'
                                } shadow-2xl transition-all`}>
                                <img
                                    src="/customer-avatar.png"
                                    alt="Customer"
                                    className="w-full h-full object-cover"
                                />
                            </div>

                            {/* Connection Status */}
                            <div className={`absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-sm font-semibold ${liveSession.isConnected
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-400 text-white'
                                }`}>
                                {liveSession.isConnected ? (
                                    <span className="flex items-center gap-1">
                                        <Wifi className="w-3 h-3" /> Connected
                                    </span>
                                ) : (
                                    <span className="flex items-center gap-1">
                                        <WifiOff className="w-3 h-3" /> Connecting...
                                    </span>
                                )}
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold text-surface-900">Sita Sharma</h2>
                        <p className="text-surface-500">Interested in {selectedVehicle?.model}</p>

                        {/* Speaking/Listening Indicator */}
                        <div className="mt-4 h-8">
                            {liveSession.isSpeaking && (
                                <div className="flex items-center gap-2 text-green-600">
                                    <Volume2 className="w-5 h-5 animate-pulse" />
                                    <span className="text-sm font-semibold">Customer is speaking...</span>
                                </div>
                            )}
                            {liveSession.isListening && !liveSession.isSpeaking && (
                                <div className="flex items-center gap-2 text-purple-600">
                                    <Mic className="w-5 h-5 animate-pulse" />
                                    <span className="text-sm font-semibold">Listening to you...</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Transcript/Messages */}
                    <Card className="mb-6">
                        <div className="p-4 h-48 overflow-y-auto space-y-3">
                            {messages.length === 0 ? (
                                <p className="text-center text-surface-400 italic">
                                    Conversation transcript will appear here...
                                </p>
                            ) : (
                                messages.map(msg => (
                                    <div
                                        key={msg.id}
                                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${msg.role === 'user'
                                            ? 'bg-deepal-500 text-white'
                                            : 'bg-surface-100 text-surface-800'
                                            }`}>
                                            {msg.content}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </Card>

                    {/* Push to Talk Button */}
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={toggleLiveListening}
                            disabled={!liveSession.isConnected}
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all ${liveSession.isListening
                                ? 'bg-red-500 text-white scale-110 shadow-2xl animate-pulse'
                                : liveSession.isConnected
                                    ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white hover:scale-105 shadow-lg hover:shadow-xl'
                                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                }`}
                        >
                            {liveSession.isListening ? (
                                <MicOff className="w-10 h-10" />
                            ) : (
                                <Mic className="w-10 h-10" />
                            )}
                        </button>
                        <p className="text-sm text-surface-500">
                            {liveSession.isListening ? 'Release to stop' : 'Hold to speak'}
                        </p>
                    </div>

                    {/* Error Display */}
                    {liveSession.error && (
                        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
                            {liveSession.error}
                        </div>
                    )}

                    {/* End Call Button */}
                    <div className="flex justify-center mt-8">
                        <Button variant="danger" onClick={endCall}>
                            <PhoneOff className="w-4 h-4 mr-2" /> End Conversation
                        </Button>
                    </div>
                </div>
            );
        }

        // Active conversation - Text Mode
        return (
            <div className="max-w-4xl mx-auto">
                {/* Header with customer */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <img
                                src="/customer-avatar.png"
                                alt="Customer"
                                className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-lg"
                            />
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2 border-white flex items-center justify-center text-xs ${customerEmotion === 'happy' ? 'bg-green-500' :
                                customerEmotion === 'interested' ? 'bg-blue-500' :
                                    customerEmotion === 'skeptical' ? 'bg-amber-500' :
                                        customerEmotion === 'thinking' ? 'bg-purple-500' :
                                            'bg-gray-400'
                                }`}>
                                {customerEmotion === 'happy' ? '😊' :
                                    customerEmotion === 'interested' ? '🤔' :
                                        customerEmotion === 'skeptical' ? '😐' :
                                            customerEmotion === 'thinking' ? '💭' : '😐'}
                            </div>
                        </div>
                        <div>
                            <h3 className="font-bold text-surface-900">Sita Sharma</h3>
                            <p className="text-sm text-surface-500">Interested in {selectedVehicle?.model}</p>
                        </div>
                    </div>
                    <Button variant="danger" onClick={endCall}>
                        <PhoneOff className="w-4 h-4 mr-2" /> End Call
                    </Button>
                </div>

                {/* Chat area */}
                <Card className="mb-4">
                    <div
                        ref={chatContainerRef}
                        className="h-96 overflow-y-auto p-4 space-y-4"
                    >
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${msg.role === 'user'
                                    ? 'bg-gradient-to-r from-deepal-500 to-accent-teal text-white'
                                    : 'bg-surface-100 text-surface-800'
                                    }`}>
                                    {msg.content}
                                </div>
                            </div>
                        ))}

                        {isAIThinking && (
                            <div className="flex justify-start">
                                <div className="bg-surface-100 rounded-2xl px-4 py-3">
                                    <div className="flex gap-1">
                                        <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce"></span>
                                        <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                                        <span className="w-2 h-2 bg-surface-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Input */}
                    <div className="border-t border-surface-200 p-4">
                        <div className="flex items-center gap-3">
                            {isSupported && (
                                <button
                                    onClick={isListening ? stopListening : startListening}
                                    className={`p-3 rounded-xl transition-all ${isListening
                                        ? 'bg-red-500 text-white animate-pulse'
                                        : 'bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:shadow-lg'
                                        }`}
                                    disabled={isAIThinking}
                                >
                                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                                </button>
                            )}
                            <input
                                type="text"
                                value={inputText}
                                onChange={(e) => setInputText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                                placeholder={isListening ? '🎤 Listening...' : 'Type or speak your response...'}
                                className="flex-1 px-4 py-3 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-deepal-500 focus:border-transparent"
                                disabled={isAIThinking}
                            />
                            <Button onClick={sendMessage} disabled={!inputText.trim() || isAIThinking}>
                                <ArrowRight className="w-4 h-4" />
                            </Button>
                        </div>
                        {isListening && (
                            <p className="text-sm text-red-500 mt-2 flex items-center gap-2">
                                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                                Recording... Speak now!
                            </p>
                        )}
                    </div>
                </Card>

                {/* Vehicle Info */}
                <Card className="p-4 bg-surface-50">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-surface-500">Currently discussing</p>
                            <p className="font-bold text-surface-900">{selectedVehicle?.model} {selectedVehicle?.variant}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-surface-500">Price</p>
                            <p className="font-bold text-deepal-600">NPR {((selectedVehicle?.price || 0) / 100000).toFixed(1)} Lakhs</p>
                        </div>
                    </div>
                </Card>
            </div>
        );
    };

    // ============ MAIN RENDER ============
    return (
        <div className="p-6 lg:p-10">
            {view === 'home' && renderHome()}
            {view === 'playbook' && renderPlaybook()}
            {view === 'protocol' && renderProtocol()}
            {view === 'simulator' && renderSimulator()}
        </div>
    );
};

export default SalesAcademy;
