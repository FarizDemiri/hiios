
import { FailureMode } from '../types.js';
import { PodFacts } from '../../gatherers/pod-gatherer.js';

export const crashLoopBackOffMode: FailureMode = {
    id: 'crash-loop-back-off',
    name: 'CrashLoopBackOff',
    meaning: 'The application starts but exits immediately or repeatedly. Kubernetes keeps restarting it, but the same failure repeats.',
    commonCauses: [
        'Missing or incorrect environment variable',
        'Configuration file not mounted or invalid',
        'Dependency service unreachable (database, API)',
        'Application code bug (panic, unhandled exception)',
        'Insufficient file permissions'
    ],
    signals: [
        {
            source: 'status',
            required: true,
            pattern: (facts: PodFacts) => {
                // Check if any container is in CrashLoopBackOff or restarting frequently
                return facts.containerStatuses.some(status => {
                    const isCrashLoop = status.state?.waiting?.reason === 'CrashLoopBackOff';
                    const highRestarts = status.restartCount > 3;
                    const recentExit = status.lastState?.terminated?.exitCode !== undefined && status.lastState?.terminated?.exitCode !== 137;
                    return isCrashLoop || (highRestarts && recentExit);
                });
            },
            description: 'Container status is CrashLoopBackOff or restart count is high'
        },
        {
            source: 'event',
            required: false,
            pattern: 'Back-off restarting failed container',
            description: 'Event log contains back-off warning'
        }
    ],
    nextChecks: [
        'Read the last 50 lines of logs',
        'Check if required ConfigMaps/Secrets are present',
        'Verify environment variables match application requirements',
        'Test if downstream dependencies are reachable'
    ]
};
