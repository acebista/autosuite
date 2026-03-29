import React from 'react';
import { Lead } from '../types';
import {
    calculateLeadScore,
    detectUrgencySignals,
    getRecommendedActions,
    predictConversionProbability
} from '../lib/aiLeadScoring';
import { TrendingUp, AlertTriangle, CheckCircle, Clock, Target } from 'lucide-react';

interface LeadScoreCardProps {
    lead: Lead;
}

export const LeadScoreCard: React.FC<LeadScoreCardProps> = ({ lead }) => {
    // Calculate scoring factors
    const lastActivityDate = lead.updatedAt ? new Date(lead.updatedAt) : new Date(lead.createdAt);
    const daysSinceFirstContact = Math.floor(
        (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24)
    );

    const scoreBreakdown = calculateLeadScore(lead, {
        quotationOpened: lead.quotationIssued,
        testDriveCompleted: !!lead.testDriveDate && new Date(lead.testDriveDate) < new Date(),
        whatsappRepliesReceived: 0, // Would come from activity tracking
        lastActivityDate,
        competitorMentioned: lead.remarks?.toLowerCase().includes('competitor') || false,
        financingApproved: false, // Would come from finance module
        daysSinceFirstContact,
        budgetConfirmed: lead.budget > 0
    });

    const urgencySignals = detectUrgencySignals(lead);
    const recommendedActions = getRecommendedActions(lead, scoreBreakdown);
    const conversionPrediction = predictConversionProbability(lead);

    // Priority color mapping
    const priorityColors = {
        HOT: 'bg-red-500 text-white',
        WARM: 'bg-amber-500 text-white',
        COLD: 'bg-blue-500 text-white'
    };

    const priorityIcons = {
        HOT: '🔥',
        WARM: '☀️',
        COLD: '❄️'
    };

    return (
        <div className="space-y-4">
            {/* Score Overview */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm opacity-90 mb-1">AI Lead Score</div>
                        <div className="text-5xl font-black">{scoreBreakdown.totalScore}</div>
                        <div className="text-sm opacity-90 mt-1">out of 100</div>
                    </div>
                    <div className="text-right">
                        <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${priorityColors[scoreBreakdown.priority]} font-bold text-lg`}>
                            <span>{priorityIcons[scoreBreakdown.priority]}</span>
                            {scoreBreakdown.priority}
                        </div>
                        <div className="text-sm opacity-90 mt-2">
                            Conversion: {conversionPrediction.probability}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Score Breakdown */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <TrendingUp size={18} />
                    Score Breakdown
                </h3>
                <div className="space-y-2">
                    <ScoreRow label="Base Score" value={scoreBreakdown.baseScore} isPositive />
                    {scoreBreakdown.interactionBonus > 0 && (
                        <ScoreRow
                            label="Interaction Bonus"
                            value={scoreBreakdown.interactionBonus}
                            isPositive
                        />
                    )}
                    {scoreBreakdown.urgencyBonus > 0 && (
                        <ScoreRow
                            label="Urgency Bonus"
                            value={scoreBreakdown.urgencyBonus}
                            isPositive
                        />
                    )}
                    {scoreBreakdown.decayPenalty > 0 && (
                        <ScoreRow
                            label="Inactivity Penalty"
                            value={-scoreBreakdown.decayPenalty}
                            isPositive={false}
                        />
                    )}
                </div>

                {scoreBreakdown.reasons.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-slate-200">
                        <div className="text-xs font-semibold text-slate-600 mb-2">Factors:</div>
                        <div className="flex flex-wrap gap-2">
                            {scoreBreakdown.reasons.map((reason, i) => (
                                <span
                                    key={i}
                                    className="text-xs bg-slate-100 text-slate-700 px-2 py-1 rounded-lg"
                                >
                                    {reason}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Urgency Signals */}
            {urgencySignals.hasUrgency && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <h3 className="font-bold text-red-900 mb-2 flex items-center gap-2">
                        <AlertTriangle size={18} />
                        Urgency Signals Detected
                    </h3>
                    <ul className="space-y-1">
                        {urgencySignals.signals.map((signal, i) => (
                            <li key={i} className="text-sm text-red-800 flex items-center gap-2">
                                <span className="text-red-500">•</span>
                                {signal}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Recommended Actions */}
            {recommendedActions.length > 0 && (
                <div className="bg-white rounded-xl border border-slate-200 p-5">
                    <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                        <Target size={18} />
                        Recommended Actions
                    </h3>
                    <ul className="space-y-2">
                        {recommendedActions.map((action, i) => (
                            <li key={i} className="flex items-start gap-2 text-sm">
                                <CheckCircle size={16} className="text-green-500 mt-0.5 flex-shrink-0" />
                                <span className="text-slate-700">{action}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* Conversion Prediction */}
            <div className="bg-white rounded-xl border border-slate-200 p-5">
                <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2">
                    <Clock size={18} />
                    Conversion Prediction
                </h3>

                <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                        <span className="text-slate-600">Probability</span>
                        <span className="font-bold text-slate-900">{conversionPrediction.probability}%</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-3">
                        <div
                            className="bg-gradient-to-r from-green-500 to-emerald-500 h-3 rounded-full transition-all"
                            style={{ width: `${conversionPrediction.probability}%` }}
                        />
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                        Confidence: {conversionPrediction.confidence}
                    </div>
                </div>

                {conversionPrediction.factors.length > 0 && (
                    <div>
                        <div className="text-xs font-semibold text-slate-600 mb-2">Analysis:</div>
                        <div className="space-y-1">
                            {conversionPrediction.factors.map((factor, i) => (
                                <div
                                    key={i}
                                    className="text-xs text-slate-700 flex items-center gap-2"
                                >
                                    <span className={factor.startsWith('+') ? 'text-green-600' : 'text-red-600'}>
                                        {factor.startsWith('+') ? '▲' : '▼'}
                                    </span>
                                    {factor}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const ScoreRow: React.FC<{ label: string; value: number; isPositive: boolean }> = ({
    label,
    value,
    isPositive
}) => (
    <div className="flex justify-between items-center text-sm">
        <span className="text-slate-600">{label}</span>
        <span className={`font-semibold ${isPositive ? 'text-green-600' : 'text-red-600'
            }`}>
            {isPositive && value > 0 && '+'}{value}
        </span>
    </div>
);
