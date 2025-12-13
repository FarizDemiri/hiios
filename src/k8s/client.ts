
import * as k8s from '@kubernetes/client-node';
import { KubernetesClient } from './types.js';

export class K8sClient implements KubernetesClient {
    private k8sApi: k8s.CoreV1Api;

    constructor() {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        this.k8sApi = kc.makeApiClient(k8s.CoreV1Api);
    }

    async getPod(namespace: string, name: string): Promise<k8s.V1Pod> {
        try {
            const res = await this.k8sApi.readNamespacedPod(name, namespace);
            return res.body;
        } catch (err: any) {
            throw new Error(`Failed to get pod ${name} in namespace ${namespace}: ${err.message}`);
        }
    }

    async getEvents(namespace: string, resourceName: string): Promise<k8s.CoreV1Event[]> {
        try {
            // Field selector to filter events for the specific object
            const fieldSelector = `involvedObject.name=${resourceName}`;
            const res = await this.k8sApi.listNamespacedEvent(namespace, undefined, undefined, undefined, fieldSelector);
            return res.body.items;
        } catch (err: any) {
            console.warn(`Warning: Failed to get events for ${resourceName}: ${err.message}`);
            return [];
        }
    }

    async getLogs(namespace: string, podName: string, containerName: string, lines: number = 50): Promise<string> {
        try {
            const res = await this.k8sApi.readNamespacedPodLog(
                podName,
                namespace,
                containerName,
                undefined,
                undefined,
                undefined,
                lines as any,  // tailLines (library type definition mismatch hack)
                undefined,
                undefined,
                undefined,
                undefined
            );
            return res.body;
        } catch (err: any) {
            return `(Unable to retrieve logs: ${err.message})`;
        }
    }

    async getService(namespace: string, name: string): Promise<k8s.V1Service> {
        try {
            const res = await this.k8sApi.readNamespacedService(name, namespace);
            return res.body;
        } catch (err: any) {
            throw new Error(`Failed to get service ${name}: ${err.message}`);
        }
    }

    async getEndpoints(namespace: string, name: string): Promise<k8s.V1Endpoints> {
        try {
            const res = await this.k8sApi.readNamespacedEndpoints(name, namespace);
            return res.body;
        } catch (err: any) {
            throw new Error(`Failed to get endpoints ${name}: ${err.message}`);
        }
    }
}
