
import { V1Service, V1Endpoints, V1Pod } from '@kubernetes/client-node';
import { K8sClient } from '../k8s/client.js';

export interface ServiceFacts {
    service: V1Service;
    endpoints: V1Endpoints;
    matchingPods: V1Pod[];
}

export class ServiceGatherer {
    constructor(private client: K8sClient) { }

    async gather(namespace: string, serviceName: string): Promise<ServiceFacts> {
        console.log(`Gathering facts for service ${serviceName} in ${namespace}...`);

        const service = await this.client.getService(namespace, serviceName);
        const endpoints = await this.client.getEndpoints(namespace, serviceName);

        // We can't easily query pods by selector without converting the selector map to a string
        // kept simple for now - just returning empty list as we can infer a lot from endpoints/service
        // Real implementation would parse service.spec.selector

        return {
            service,
            endpoints,
            matchingPods: [] // populated in v0.2+ with actual label matching logic
        };
    }
}
