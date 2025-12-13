
import { FailureMode } from '../types.js';
import { ServiceFacts } from '../../gatherers/service-gatherer.js';

export const serviceNoEndpointsMode: FailureMode = {
    id: 'service-no-endpoints',
    name: 'ServiceNoEndpoints',
    meaning: 'A Service exists but has no healthy backend pods to route traffic to. All requests to this Service will fail.',
    commonCauses: [
        'Service selector doesn\'t match any pod labels',
        'All pods matching the selector are failing or in non-ready state',
        'No pods exist that match the selector',
        'Pods exist but readiness probes are failing',
        'Namespace mismatch'
    ],
    signals: [
        {
            source: 'status',
            required: true,
            pattern: (facts: any) => {
                const serviceFacts = facts as ServiceFacts;

                // Strict Type Guard: Only match if this is actually ServiceFacts
                if (!serviceFacts.service || !('endpoints' in serviceFacts)) {
                    return false;
                }

                // Check if endpoints exist but subsets are empty or null
                return !serviceFacts.endpoints ||
                    !serviceFacts.endpoints.subsets ||
                    serviceFacts.endpoints.subsets.length === 0 ||
                    // Or subsets exist but no addresses (only notReadyAddresses)
                    serviceFacts.endpoints.subsets.every(s => !s.addresses || s.addresses.length === 0);
            },
            description: 'Service has no healthy endpoints'
        }
    ],
    nextChecks: [
        'Verify service selector matches pod labels exactly',
        'Check if pods exist with the expected labels',
        'Investigate why matching pods are not ready',
        'Review readiness probe configuration',
        'Ensure pods and service are in the same namespace'
    ]
};
