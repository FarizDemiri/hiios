
import { allFailureModes } from './src/catalog/index.js';
import { Matcher } from './src/catalog/matcher.js';
import { Narrator } from './src/narrator/explain.js';
import { PodFacts } from './src/gatherers/pod-gatherer.js';
// Mock import for ServiceFacts type
import { ServiceFacts } from './src/gatherers/service-gatherer.js';

console.log('Running v0.2 Verification Tests...\n');

// 1. Mock ImagePullBackOff
const mockImagePull: PodFacts = {
    pod: {
        metadata: { name: 'image-fail', namespace: 'default' },
        status: {
            containerStatuses: [
                {
                    name: 'app',
                    state: { waiting: { reason: 'ImagePullBackOff', message: 'Back-off pulling image' } },
                    image: 'my-app:bad-tag',
                    ready: false,
                    restartCount: 0
                }
            ]
        }
    } as any,
    events: [
        { message: 'Failed to pull image "my-app:bad-tag": rpc error: code = Unknown desc = Error response from daemon: manifest for my-app:bad-tag not found: manifest unknown' }
    ] as any,
    logs: {},
    containerStatuses: [
        {
            name: 'app',
            state: { waiting: { reason: 'ImagePullBackOff' } },
            image: 'my-app:bad-tag',
            restartCount: 0
        }
    ] as any
};

console.log('--- TEST 1: ImagePullBackOff ---');
const matches1 = Matcher.match(mockImagePull, allFailureModes);
if (matches1.length > 0 && matches1[0].mode.id === 'image-pull-back-off') {
    const narrator = new Narrator();
    const explanation = narrator.explainImagePull(matches1[0].mode, mockImagePull);
    narrator.render(explanation);
} else {
    console.error('FAILED to detect ImagePullBackOff');
}


// 2. Mock OOMKilled
const mockOOM: PodFacts = {
    pod: {
        metadata: { name: 'oom-app', namespace: 'default' },
        status: {}
    } as any,
    events: [
        { message: 'OOMKilled' }
    ] as any,
    logs: {},
    containerStatuses: [
        {
            name: 'memory-hog',
            lastState: { terminated: { reason: 'OOMKilled', exitCode: 137 } },
            restartCount: 5,
            ready: false
        }
    ] as any
};

console.log('\n--- TEST 2: OOMKilled ---');
const matches2 = Matcher.match(mockOOM, allFailureModes);
if (matches2.length > 0 && matches2[0].mode.id === 'oom-killed') {
    const narrator = new Narrator();
    const explanation = narrator.explainOOM(matches2[0].mode, mockOOM);
    narrator.render(explanation);
} else {
    console.error('FAILED to detect OOMKilled');
}


// 3. Mock ServiceNoEndpoints
const mockService: ServiceFacts = {
    service: {
        metadata: { name: 'dead-svc', namespace: 'prod' },
        spec: { selector: { app: 'api' } }
    } as any,
    endpoints: {
        subsets: [] // Empty subsets = no endpoints
    } as any,
    matchingPods: []
};

console.log('\n--- TEST 3: ServiceNoEndpoints ---');
// Filter for service modes manually as the CLI would
const svcModes = allFailureModes.filter(m => m.id === 'service-no-endpoints');
const matches3 = Matcher.match(mockService, svcModes);

if (matches3.length > 0 && matches3[0].mode.id === 'service-no-endpoints') {
    const narrator = new Narrator();
    const explanation = narrator.explainServiceNoEndpoints(matches3[0].mode, mockService);
    narrator.render(explanation);
} else {
    console.error('FAILED to detect ServiceNoEndpoints');
}
