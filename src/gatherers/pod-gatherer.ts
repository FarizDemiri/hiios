
import { V1Pod, CoreV1Event, V1ContainerStatus } from '@kubernetes/client-node';
import { K8sClient } from '../k8s/client.js';

export interface PodFacts {
    pod: V1Pod;
    events: CoreV1Event[];
    logs: Record<string, string>; // containerName -> logs
    containerStatuses: V1ContainerStatus[];
}

export class PodGatherer {
    constructor(private client: K8sClient) { }

    async gather(namespace: string, podName: string): Promise<PodFacts> {
        console.log(`Gathering facts for pod ${podName} in ${namespace}...`);

        // Parallelize detailed gathering where possible, but for now sequential is safer for clarity
        const pod = await this.client.getPod(namespace, podName);
        const events = await this.client.getEvents(namespace, podName);

        const logs: Record<string, string> = {};
        const statuses = pod.status?.containerStatuses || [];

        // Gather logs for all containers
        for (const status of statuses) {
            if (status.name) {
                const containerLogs = await this.client.getLogs(namespace, podName, status.name, 50);
                logs[status.name] = containerLogs;
            }
        }

        return {
            pod,
            events,
            logs,
            containerStatuses: statuses
        };
    }
}
