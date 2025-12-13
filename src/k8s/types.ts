
import { V1Pod, CoreV1Event, V1Service, V1Endpoints } from '@kubernetes/client-node';

export interface KubernetesClient {
    getPod(namespace: string, name: string): Promise<V1Pod>;
    getEvents(namespace: string, resourceName: string): Promise<CoreV1Event[]>;
    getLogs(namespace: string, podName: string, containerName: string, lines?: number): Promise<string>;
    getService(namespace: string, name: string): Promise<V1Service>;
    getEndpoints(namespace: string, name: string): Promise<V1Endpoints>;
}
