
import { PodFacts } from '../gatherers/pod-gatherer.js';

export interface Signal {
    source: 'event' | 'status' | 'log' | 'metric';
    pattern: string | ((facts: PodFacts) => boolean);
    required: boolean;
    description?: string;
}

export interface FailureMode {
    id: string;
    name: string;
    meaning: string;
    commonCauses: string[];
    signals: Signal[];
    nextChecks: string[];
    runbookTags?: string[];
}
