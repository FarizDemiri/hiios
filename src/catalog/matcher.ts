
import { FailureMode } from './types.js';
import { PodFacts } from '../gatherers/pod-gatherer.js';
import { ServiceFacts } from '../gatherers/service-gatherer.js';

export interface MatchResult {
    mode: FailureMode;
    confidence: number; // 0.0 to 1.0
    matchedSignals: string[];
}

export class Matcher {
    static match(facts: PodFacts | ServiceFacts, modes: FailureMode[]): MatchResult[] {
        const results: MatchResult[] = [];

        for (const mode of modes) {
            const match = Matcher.checkMode(mode, facts);
            if (match) {
                results.push(match);
            }
        }


        // Priority map for sorting matches
        const priorityOrder: Record<string, number> = {
            'oom-killed': 1,
            'image-pull-back-off': 2,
            'service-no-endpoints': 3,
            'crash-loop-back-off': 4
        };

        // Sort by priority (asc) then confidence (desc)
        return results.sort((a, b) => {
            const priorityA = priorityOrder[a.mode.id] || 999;
            const priorityB = priorityOrder[b.mode.id] || 999;

            if (priorityA !== priorityB) {
                return priorityA - priorityB;
            }
            return b.confidence - a.confidence;
        });
    }

    private static checkMode(mode: FailureMode, facts: any): MatchResult | null {
        let matchedCount = 0;
        let totalRequired = 0;
        const matchedSignals: string[] = [];

        for (const signal of mode.signals) {
            if (signal.required) totalRequired++;

            let isMatch = false;
            if (typeof signal.pattern === 'function') {
                isMatch = signal.pattern(facts);
            } else if (signal.source === 'event') {
                // Generic event string matching if not a function
                if (facts.events) {
                    isMatch = facts.events.some((e: any) => e.message && e.message.includes(signal.pattern));
                }
            } else if (signal.source === 'status') {
                // Status pattern usually handled by function, but just in case
                isMatch = false;
            }

            if (isMatch) {
                matchedCount++;
                matchedSignals.push(signal.description || 'Unknown signal');
            } else if (signal.required) {
                // If a required signal fails, this mode is not a match
                return null;
            }
        }

        // verification: if no signals defined, shouldn't match
        if (mode.signals.length === 0) return null;

        // Simple confidence: 1.0 if all required matched (already true here) + bonus for optional
        // For now, let's just use 1.0 for full match since we return null on failure
        return {
            mode,
            confidence: 1.0,
            matchedSignals
        };
    }
}
