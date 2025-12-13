
import { crashLoopBackOffMode } from './src/catalog/modes/crashloop.js';
import { PodFacts } from './src/gatherers/pod-gatherer.js';
import { Narrator } from './src/narrator/explain.js';

// Mock data to simulate an active CrashLoopBackOff scenario
const mockFacts: PodFacts = {
    pod: {
        metadata: {
            name: 'payment-service-x829s',
            namespace: 'production',
            ownerReferences: [
                {
                    apiVersion: 'apps/v1',
                    kind: 'ReplicaSet',
                    name: 'payment-service-x829s',
                    uid: '123'
                }
            ]
        },
        status: {
            phase: 'Running',
            containerStatuses: [
                {
                    name: 'payment-service',
                    restartCount: 14,
                    state: {
                        waiting: {
                            reason: 'CrashLoopBackOff',
                            message: 'Back-off 5m0s restarting failed container=payment-service pod=payment-service-x829s_production(123)'
                        }
                    },
                    lastState: {
                        terminated: {
                            exitCode: 1,
                            reason: 'Error',
                            finishedAt: new Date(),
                            startedAt: new Date()
                        }
                    },
                    ready: false,
                    image: 'payment-service:v1.2.3',
                    imageID: 'docker-pullable://payment-service@sha256:123'
                }
            ]
        }
    },
    events: [
        {
            metadata: { name: 'evt-1' },
            committed: new Date(),
            message: 'Back-off restarting failed container',
            reason: 'BackOff',
            type: 'Warning',
            involvedObject: { kind: 'Pod', name: 'payment-service-x829s' }
        }
    ],
    logs: {
        'payment-service': `
2025-12-13T10:00:01 INFO Starting payment service...
2025-12-13T10:00:02 INFO Loading configuration...
2025-12-13T10:00:03 ERROR Failed to connect to database: Connection refused
2025-12-13T10:00:03 FATAL Unhandled exception: Error: DB_CONNECTION_STRING environment variable is missing
    `
    },
    containerStatuses: [
        {
            name: 'payment-service',
            restartCount: 14,
            state: {
                waiting: {
                    reason: 'CrashLoopBackOff',
                    message: 'Back-off 5m0s restarting failed container'
                }
            },
            lastState: {
                terminated: {
                    exitCode: 1,
                    reason: 'Error',
                    finishedAt: new Date(),
                    startedAt: new Date()
                }
            },
            ready: false,
            image: 'payment-service:v1.2.3',
            imageID: 'docker-pullable://payment-service@sha256:123'
        }
    ]
};

console.log('Running mockup test for Hiios Output...');
const narrator = new Narrator();
const explanation = narrator.explainCrashLoop(crashLoopBackOffMode, mockFacts);
narrator.render(explanation);
