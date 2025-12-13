
import { FailureMode } from '../types.js';
import { PodFacts } from '../../gatherers/pod-gatherer.js';

export const oomKilledMode: FailureMode = {
    id: 'oom-killed',
    name: 'OOMKilled',
    meaning: 'The container exceeded its memory limit and was terminated by Kubernetes. This is a resource constraint issue, not an application crash.',
    commonCauses: [
        'Memory leak in the application code',
        'Memory limit set too low for the workload',
        'Unexpected traffic spike causing increased memory usage',
        'Large dataset loaded into memory without streaming',
        'Inefficient memory usage patterns'
    ],
    signals: [
        {
            source: 'status',
            required: true,
            pattern: (facts: PodFacts) => {
                return facts.containerStatuses.some(status =>
                    status.lastState?.terminated?.reason === 'OOMKilled' ||
                    // Exit code 137 is SIGKILL (128 + 9), often OOM, but OOMKilled reason is stronger
                    (status.lastState?.terminated?.exitCode === 137)
                );
            },
            description: 'Container terminated with OOMKilled or exit code 137'
        },
        {
            source: 'event',
            required: false,
            pattern: 'OOMKilled',
            description: 'Event mentions OOMKilled'
        }
    ],
    nextChecks: [
        'Compare memory limit vs memory request',
        'Monitor actual memory usage over time',
        'Investigate application code for memory leaks',
        'Consider increasing memory limit if workload legitimately needs more',
        'Review if traffic spikes correlate with OOMKills'
    ]
};
