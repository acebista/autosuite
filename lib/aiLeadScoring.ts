import { Lead } from '../types';

/**
 * AI Lead Scoring Service
 * Phase 2: Profit & Intelligence
 * 
 * Calculates dynamic lead scores based on:
 * - Behavioral interactions (quotation opens, test drives, replies)
 * - Time decay (inactivity)
 * - Urgency signals (competitor mentions, financing)
 */

interface ScoringFactors {
    quotationOpened: boolean;
    testDriveCompleted: boolean;
    whatsappRepliesReceived: number;
    lastActivityDate: Date;
    competitorMentioned: boolean;
    financingApproved: boolean;
    daysSinceFirstContact: number;
    budgetConfirmed: boolean;
}

interface ScoreBreakdown {
    baseScore: number;
    interactionBonus: number;
    decayPenalty: number;
    urgencyBonus: number;
    totalScore: number;
    priority: 'HOT' | 'WARM' | 'COLD';
    reasons: string[];
}

/**
 * Calculate lead score based on behavioral factors
 */
export const calculateLeadScore = (
    lead: Lead,
    factors: Partial<ScoringFactors>
): ScoreBreakdown => {
    const breakdown: ScoreBreakdown = {
        baseScore: 50, // Everyone starts at 50
        interactionBonus: 0,
        decayPenalty: 0,
        urgencyBonus: 0,
        totalScore: 0,
        priority: 'WARM',
        reasons: []
    };

    // === INTERACTION BONUSES ===
    if (factors.quotationOpened) {
        breakdown.interactionBonus += 10;
        breakdown.reasons.push('Quotation opened (+10)');
    }

    if (factors.testDriveCompleted) {
        breakdown.interactionBonus += 30;
        breakdown.reasons.push('Test drive completed (+30)');
    }

    if (factors.whatsappRepliesReceived) {
        const replyBonus = Math.min(factors.whatsappRepliesReceived * 15, 45); // Cap at 3 replies
        breakdown.interactionBonus += replyBonus;
        breakdown.reasons.push(`${factors.whatsappRepliesReceived} WhatsApp replies (+${replyBonus})`);
    }

    if (factors.budgetConfirmed) {
        breakdown.interactionBonus += 20;
        breakdown.reasons.push('Budget confirmed (+20)');
    }

    // === TIME DECAY ===
    if (factors.lastActivityDate) {
        const hoursSinceLastActivity = (Date.now() - factors.lastActivityDate.getTime()) / (1000 * 60 * 60);
        const daysSinceLastActivity = Math.floor(hoursSinceLastActivity / 24);

        if (hoursSinceLastActivity >= 48) {
            const decayPeriods = Math.floor(hoursSinceLastActivity / 48);
            breakdown.decayPenalty = Math.min(decayPeriods * 5, 30); // Max -30 for decay
            breakdown.reasons.push(`${daysSinceLastActivity}d inactive (-${breakdown.decayPenalty})`);
        }
    }

    // === URGENCY SIGNALS ===
    if (factors.competitorMentioned) {
        breakdown.urgencyBonus += 15;
        breakdown.reasons.push('Competitor mentioned (+15)');
    }

    if (factors.financingApproved) {
        breakdown.urgencyBonus += 25;
        breakdown.reasons.push('Financing approved (+25)');
    }

    // If they've been in the pipeline for more than 30 days without converting, add urgency
    if (factors.daysSinceFirstContact && factors.daysSinceFirstContact > 30) {
        breakdown.urgencyBonus += 10;
        breakdown.reasons.push('Extended pipeline presence (+10)');
    }

    // === CALCULATE TOTAL ===
    breakdown.totalScore = Math.max(
        0,
        Math.min(
            100,
            breakdown.baseScore +
            breakdown.interactionBonus +
            breakdown.urgencyBonus -
            breakdown.decayPenalty
        )
    );

    // === DETERMINE PRIORITY ===
    if (breakdown.totalScore >= 75) {
        breakdown.priority = 'HOT';
    } else if (breakdown.totalScore >= 40) {
        breakdown.priority = 'WARM';
    } else {
        breakdown.priority = 'COLD';
    }

    return breakdown;
};

/**
 * Detect urgency signals from lead data
 */
export const detectUrgencySignals = (lead: Lead): {
    hasUrgency: boolean;
    signals: string[];
} => {
    const signals: string[] = [];

    // Check if competitor models are mentioned in remarks
    const competitorKeywords = [
        'maruti', 'hyundai', 'honda', 'mahindra', 'tata',
        'kia', 'mg', 'nissan', 'competing', 'other dealer'
    ];

    if (lead.remarks) {
        const remarksLower = lead.remarks.toLowerCase();
        competitorKeywords.forEach(keyword => {
            if (remarksLower.includes(keyword)) {
                signals.push(`Competitor mention: "${keyword}"`);
            }
        });
    }

    // Check if test drive is scheduled soon
    if (lead.testDriveDate) {
        const testDriveDate = new Date(lead.testDriveDate);
        const daysUntilTestDrive = (testDriveDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24);

        if (daysUntilTestDrive >= 0 && daysUntilTestDrive <= 3) {
            signals.push('Test drive scheduled within 3 days');
        }
    }

    // Check if booking date is set
    if (lead.bookingDate) {
        signals.push('Booking date confirmed');
    }

    // Check if budget is substantial
    if (lead.budget && lead.budget > 5000000) {
        signals.push('High-value customer (₹50L+)');
    }

    return {
        hasUrgency: signals.length > 0,
        signals
    };
};

/**
 * Get recommended next actions for a lead based on score and status
 */
export const getRecommendedActions = (lead: Lead, scoreBreakdown: ScoreBreakdown): string[] => {
    const actions: string[] = [];

    // For HOT leads
    if (scoreBreakdown.priority === 'HOT') {
        if (!lead.testDriveDate) {
            actions.push('🎯 Schedule test drive immediately');
        }
        if (!lead.quotationIssued) {
            actions.push('📄 Issue formal quotation');
        }
        if (!lead.bookingDate) {
            actions.push('💰 Discuss booking and down payment');
        }
        actions.push('📞 Follow up today - HIGH PRIORITY');
    }

    // For WARM leads
    if (scoreBreakdown.priority === 'WARM') {
        if (!lead.nextFollowUpDate) {
            actions.push('📅 Set follow-up date');
        }
        if (!lead.testDriveDate && lead.status !== 'Lost') {
            actions.push('🚗 Propose test drive');
        }
        if (!lead.quotationIssued) {
            actions.push('💬 Send quotation via WhatsApp');
        }
    }

    // For COLD leads (re-engagement)
    if (scoreBreakdown.priority === 'COLD') {
        actions.push('❄️ Lead is cooling - send re-engagement message');
        actions.push('🎁 Consider offering limited-time discount');
        if (lead.status !== 'Lost') {
            actions.push('📊 Reassess lead quality - mark as Lost if unresponsive');
        }
    }

    // Check for inactivity
    if (lead.nextFollowUpDate) {
        const followUpDate = new Date(lead.nextFollowUpDate);
        if (followUpDate < new Date()) {
            actions.unshift('⚠️ OVERDUE follow-up!');
        }
    }

    return actions;
};

/**
 * Analyze lead conversion probability
 */
export const predictConversionProbability = (lead: Lead): {
    probability: number;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    factors: string[];
} => {
    let probability = 0.5; // Start at 50%
    const factors: string[] = [];

    // Positive indicators
    if (lead.quotationIssued) {
        probability += 0.15;
        factors.push('+15% Quotation issued');
    }

    if (lead.testDriveDate) {
        probability += 0.20;
        factors.push('+20% Test drive scheduled/completed');
    }

    if (lead.bookingDate) {
        probability += 0.25;
        factors.push('+25% Booking confirmed');
    }

    if (lead.budget && lead.budget > 0) {
        probability += 0.10;
        factors.push('+10% Budget specified');
    }

    if (lead.temperature === 'Hot') {
        probability += 0.15;
        factors.push('+15% Marked as HOT');
    }

    // Negative indicators
    if (lead.status === 'Lost') {
        probability = 0;
        factors.push('Lead marked as Lost');
    }

    const daysSinceCreation = (Date.now() - new Date(lead.createdAt).getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 60 && !lead.testDriveDate) {
        probability -= 0.20;
        factors.push('-20% Stagnant for 60+ days');
    }

    // Clamp probability
    probability = Math.max(0, Math.min(1, probability));

    // Determine confidence
    let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (factors.length >= 4) confidence = 'HIGH';
    if (factors.length <= 2) confidence = 'LOW';

    return {
        probability: Math.round(probability * 100),
        confidence,
        factors
    };
};
