
import { FailureMode } from '../types.js';
import { PodFacts } from '../../gatherers/pod-gatherer.js';

export const imagePullBackOffMode: FailureMode = {
    id: 'image-pull-back-off',
    name: 'ImagePullBackOff',
    meaning: 'Kubernetes cannot retrieve the container image from the registry. The pod cannot start until the image is successfully pulled.',
    commonCauses: [
        'Image name is incorrect or misspelled',
        'Image tag does not exist in the registry',
        'Private registry credentials are missing or incorrect',
        'Registry is unreachable due to network issues',
        'Rate limit hit on public registry'
    ],
    signals: [
        {
            source: 'status',
            required: true,
            pattern: (facts: PodFacts) => {
                return facts.containerStatuses.some(status =>
                    status.state?.waiting?.reason === 'ImagePullBackOff' ||
                    status.state?.waiting?.reason === 'ErrImagePull'
                );
            },
            description: 'Container status is ImagePullBackOff or ErrImagePull'
        },
        {
            source: 'event',
            required: false,
            pattern: (facts: PodFacts) => {
                return facts.events.some(e =>
                    e.message?.includes('Failed to pull image') ||
                    e.message?.includes('image pull failed')
                );
            },
            description: 'Event log contains image pull failure'
        }
    ],
    nextChecks: [
        'Verify the image name and tag are correct',
        'Check if the image exists in the registry',
        'For private registries: verify imagePullSecrets are configured',
        'Check network connectivity to the registry',
        'Check for registry rate limits'
    ]
};
