import React, { useRef, useState, useEffect } from 'react';
import { Button } from '../UI';
import { RotateCcw, Check, X } from 'lucide-react';

interface SignaturePadProps {
    onSave: (signatureDataUrl: string) => void;
    onCancel: () => void;
    title?: string;
    subtitle?: string;
}

const SignaturePad: React.FC<SignaturePadProps> = ({
    onSave,
    onCancel,
    title = "Customer Signature",
    subtitle = "Please sign below to authorize this document"
}) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [isEmpty, setIsEmpty] = useState(true);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set canvas size to match display size
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

        // Set drawing style
        ctx.strokeStyle = '#1e293b'; // slate-900
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
    }, []);

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        setIsEmpty(false);

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const rect = canvas.getBoundingClientRect();
        const x = ('touches' in e ? e.touches[0].clientX : e.clientX) - rect.left;
        const y = ('touches' in e ? e.touches[0].clientY : e.clientY) - rect.top;

        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setIsEmpty(true);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (!canvas || isEmpty) return;

        const dataUrl = canvas.toDataURL('image/png');
        onSave(dataUrl);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-2xl font-black">{title}</h2>
                            <p className="text-indigo-100 text-sm mt-1">{subtitle}</p>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Canvas Area */}
                <div className="p-8">
                    <div className="border-4 border-dashed border-slate-200 rounded-2xl bg-slate-50 overflow-hidden">
                        <canvas
                            ref={canvasRef}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            onTouchStart={startDrawing}
                            onTouchMove={draw}
                            onTouchEnd={stopDrawing}
                            className="w-full h-64 md:h-96 cursor-crosshair touch-none"
                            style={{
                                touchAction: 'none',
                                background: 'linear-gradient(to right, #f1f5f9 1px, transparent 1px) 0 0, linear-gradient(to bottom, #f1f5f9 1px, transparent 1px) 0 0',
                                backgroundSize: '20px 20px'
                            }}
                        />
                    </div>

                    {isEmpty && (
                        <p className="text-center text-slate-400 text-sm mt-4 italic">
                            Draw your signature above using mouse or touch
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 bg-slate-50 border-t border-slate-200 flex gap-4">
                    <Button
                        variant="outline"
                        icon={RotateCcw}
                        onClick={clearCanvas}
                        disabled={isEmpty}
                        className="flex-1"
                    >
                        Clear
                    </Button>
                    <Button
                        variant="secondary"
                        onClick={onCancel}
                        className="flex-1"
                    >
                        Cancel
                    </Button>
                    <Button
                        icon={Check}
                        onClick={handleSave}
                        disabled={isEmpty}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                        Confirm Signature
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default SignaturePad;
