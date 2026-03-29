import React, { useState } from 'react';
import { PageHeader, Card, Button } from '../UI';
import { SignaturePad } from '../components';
import { FileSignature, Download } from 'lucide-react';

const SignatureDemo: React.FC = () => {
    const [showSignaturePad, setShowSignaturePad] = useState(false);
    const [savedSignature, setSavedSignature] = useState<string | null>(null);

    const handleSaveSignature = (dataUrl: string) => {
        setSavedSignature(dataUrl);
        setShowSignaturePad(false);
    };

    const downloadSignature = () => {
        if (!savedSignature) return;

        const link = document.createElement('a');
        link.href = savedSignature;
        link.download = `signature-${Date.now()}.png`;
        link.click();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            <PageHeader
                title="Digital Signature Demo"
                subtitle="Test the e-signature component for documents, quotations, and contracts."
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Demo Card */}
                <Card>
                    <div className="flex items-center gap-3 mb-6">
                        <FileSignature size={24} className="text-blue-600" />
                        <h2 className="text-xl font-black text-slate-900">Capture Signature</h2>
                    </div>

                    <p className="text-sm text-slate-600 mb-6">
                        Click the button below to open the signature pad. This component works on tablets, iPads, and desktop computers with mouse or touch input.
                    </p>

                    <Button
                        onClick={() => setShowSignaturePad(true)}
                        icon={FileSignature}
                        className="w-full"
                    >
                        Open Signature Pad
                    </Button>

                    {savedSignature && (
                        <div className="mt-6 pt-6 border-t border-slate-200">
                            <p className="text-xs font-bold text-slate-500 uppercase mb-3">Captured Signature Preview:</p>
                            <div className="bg-slate-50 rounded-xl p-6 border border-slate-200 mb-4">
                                <img
                                    src={savedSignature}
                                    alt="Signature"
                                    className="max-h-32 mx-auto"
                                />
                            </div>
                            <Button
                                variant="outline"
                                icon={Download}
                                onClick={downloadSignature}
                                className="w-full"
                            >
                                Download Signature
                            </Button>
                        </div>
                    )}
                </Card>

                {/* Use Cases */}
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-none">
                    <h2 className="text-xl font-black text-slate-900 mb-4">Use Cases</h2>
                    <div className="space-y-4">
                        {[
                            {
                                title: 'Quotation Authorization',
                                desc: 'Customer signs quote on iPad before proceeding to finance'
                            },
                            {
                                title: 'Delivery Checklist',
                                desc: 'Customer acknowledges vehicle condition during handover'
                            },
                            {
                                title: 'Service Job Approval',
                                desc: 'Approve additional repairs digitally without phone calls'
                            },
                            {
                                title: 'Finance Agreements',
                                desc: 'Sign loan documents paperlessly for faster processing'
                            }
                        ].map((useCase, i) => (
                            <div key={i} className="bg-white rounded-xl p-4 shadow-sm">
                                <p className="font-bold text-sm text-slate-900 mb-1">{useCase.title}</p>
                                <p className="text-xs text-slate-600">{useCase.desc}</p>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>

            {/* Technical Info */}
            <Card className="bg-slate-900 text-white border-none">
                <h2 className="text-xl font-black mb-4">Technical Details</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Input Support</p>
                        <p className="font-bold">Mouse & Touch</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Output Format</p>
                        <p className="font-bold">PNG (Base64)</p>
                    </div>
                    <div className="bg-white/10 rounded-lg p-4">
                        <p className="text-xs text-slate-400 uppercase tracking-wide mb-1">Resolution</p>
                        <p className="font-bold">Retina-ready</p>
                    </div>
                </div>
            </Card>

            {/* Show Signature Pad Modal */}
            {showSignaturePad && (
                <SignaturePad
                    title="Customer Signature"
                    subtitle="Please sign in the box below using your finger or mouse"
                    onSave={handleSaveSignature}
                    onCancel={() => setShowSignaturePad(false)}
                />
            )}
        </div>
    );
};

export default SignatureDemo;
