import chalk from 'chalk';
import { PodFacts } from '../gatherers/pod-gatherer.js';
import { FailureMode } from '../catalog/types.js';
import { ServiceFacts } from '../gatherers/service-gatherer.js';
import { V1EndpointSubset } from '@kubernetes/client-node';

export interface Explanation {
    summary: string;
    meaning: string;
    likelyCause: string;
    evidence: string[];
    impact: string;
    nextChecks: string[];
}

export class Narrator {
    explainCrashLoop(mode: FailureMode, facts: PodFacts): Explanation {
        const pod = facts.pod;
        const podName = pod.metadata?.name || 'unknown';
        const namespace = pod.metadata?.namespace || 'unknown';

        // Gather evidence
        const evidence: string[] = [];

        const containerStatus = facts.containerStatuses[0]; // Focus on first container for now
        if (containerStatus) {
            const restartCount = containerStatus.restartCount || 0;
            const exitCode = containerStatus.lastState?.terminated?.exitCode;
            const reason = containerStatus.state?.waiting?.reason;

            evidence.push(`Container has restarted ${restartCount} times`);

            if (reason) {
                evidence.push(`Current state: ${reason}`);
            }

            if (exitCode !== undefined) {
                evidence.push(`Last exit code: ${exitCode}`);
            }

            // Check logs for clues
            const logs = facts.logs[containerStatus.name] || '';
            const logLines = logs.split('\n').filter(line => line.trim());

            if (logLines.length > 0) {
                const lastError = logLines
                    .reverse()
                    .find(line =>
                        line.toLowerCase().includes('error') ||
                        line.toLowerCase().includes('fatal') ||
                        line.toLowerCase().includes('exception')
                    );

                if (lastError) {
                    evidence.push(`Recent log shows: "${lastError.substring(0, 100)}"`);
                }
            }
        }

        // Check events for additional context
        const backoffEvents = facts.events.filter(e =>
            e.message?.includes('Back-off restarting')
        );

        if (backoffEvents.length > 0) {
            evidence.push(`${backoffEvents.length} back-off restart events in recent history`);
        }

        // Determine likely cause based on evidence
        let likelyCause = mode.commonCauses[0]; // Default to first cause

        const logs = Object.values(facts.logs).join('\n').toLowerCase();
        if (logs.includes('environment') || logs.includes('env')) {
            likelyCause = 'Missing or incorrect environment variable';
        } else if (logs.includes('config') || logs.includes('configuration')) {
            likelyCause = 'Configuration file not mounted or invalid';
        } else if (logs.includes('connect') || logs.includes('connection')) {
            likelyCause = 'Dependency service unreachable (database, API)';
        } else if (logs.includes('panic') || logs.includes('exception')) {
            likelyCause = 'Application code bug (panic, unhandled exception)';
        }

        // Assess impact
        const deployment = pod.metadata?.ownerReferences?.find(ref =>
            ref.kind === 'ReplicaSet'
        );

        let impact = 'This pod cannot serve traffic.';
        if (deployment) {
            impact += ' If this is part of a Deployment with multiple replicas, other pods may be handling requests.';
        } else {
            impact += ' This appears to be a standalone pod, so the service is likely down.';
        }

        // Generate summary
        const summary = `Pod ${podName} in namespace ${namespace} is in CrashLoopBackOff with ${containerStatus?.restartCount || 0} restarts.`;

        return {
            summary,
            meaning: mode.meaning,
            likelyCause,
            evidence,
            impact,
            nextChecks: mode.nextChecks
        };
    }


    explainImagePull(mode: FailureMode, facts: PodFacts): Explanation {
        const pod = facts.pod;
        const podName = pod.metadata?.name || 'unknown';
        const namespace = pod.metadata?.namespace || 'unknown';
        const evidence: string[] = [];

        const containerStatus = facts.containerStatuses.find(s =>
            s.state?.waiting?.reason === 'ImagePullBackOff' ||
            s.state?.waiting?.reason === 'ErrImagePull'
        );

        if (containerStatus) {
            evidence.push(`Container '${containerStatus.name}' status: ${containerStatus.state?.waiting?.reason}`);
            evidence.push(`Image: ${containerStatus.image}`);
        }

        // Check events
        const pullEvents = facts.events.filter(e =>
            e.message?.includes('Failed to pull image') ||
            e.message?.includes('image pull failed') ||
            e.message?.includes('Back-off pulling image')
        );

        pullEvents.forEach(e => {
            if (evidence.length < 5) evidence.push(`Event: ${e.message}`);
        });

        // Determine likely cause
        let likelyCause = mode.commonCauses[0];
        const eventMessages = pullEvents.map(e => e.message || '').join(' ').toLowerCase();

        if (eventMessages.includes('access denied') || eventMessages.includes('unauthorized') || eventMessages.includes('authentication')) {
            likelyCause = 'Private registry credentials (imagePullSecrets) are missing or incorrect';
        } else if (eventMessages.includes('not found') || eventMessages.includes('manifest unknown')) {
            likelyCause = 'Image name or tag does not exist in the registry';
        } else if (eventMessages.includes('timeout') || eventMessages.includes('connection refused')) {
            likelyCause = 'Registry is unreachable due to network issues';
        } else if (eventMessages.includes('toomanyrequests')) {
            likelyCause = 'Rate limit hit on public registry (e.g., Docker Hub)';
        }

        return {
            summary: `Pod ${podName} cannot start because it fails to pull the image '${containerStatus?.image || 'unknown'}'.`,
            meaning: mode.meaning,
            likelyCause,
            evidence,
            impact: 'The pod cannot start. No containers are running.',
            nextChecks: mode.nextChecks
        };
    }

    explainOOM(mode: FailureMode, facts: PodFacts): Explanation {
        const pod = facts.pod;
        const evidence: string[] = [];

        // Find OOMKilled container
        const containerStatus = facts.containerStatuses.find(s =>
            s.lastState?.terminated?.reason === 'OOMKilled' ||
            s.lastState?.terminated?.exitCode === 137
        );

        if (containerStatus) {
            evidence.push(`Container '${containerStatus.name}' was terminated with reason: ${containerStatus.lastState?.terminated?.reason}`);
            evidence.push(`Exit Code: ${containerStatus.lastState?.terminated?.exitCode}`);
            evidence.push(`Restart Count: ${containerStatus.restartCount}`);
        }

        let likelyCause = mode.commonCauses[0];
        if (containerStatus && containerStatus.restartCount > 5) {
            likelyCause = 'Possible memory leak (frequent restarts)';
        }

        return {
            summary: `Container in pod ${pod.metadata?.name} was killed because it ran out of memory (OOMKilled).`,
            meaning: mode.meaning,
            likelyCause,
            evidence,
            impact: 'The container crashes when it exceeds memory limits. If in a deployment, this causes degraded availability.',
            nextChecks: mode.nextChecks
        };
    }

    explainServiceNoEndpoints(mode: FailureMode, facts: any): Explanation {
        // facts is ServiceFacts
        const serviceFacts = facts as ServiceFacts;
        const service = serviceFacts.service;
        const endpoints = serviceFacts.endpoints;
        const evidence: string[] = [];

        evidence.push(`Service Name: ${service.metadata?.name}`);
        evidence.push(`Namespace: ${service.metadata?.namespace}`);

        // Check selector
        if (service.spec?.selector) {
            const selector = Object.entries(service.spec.selector).map(([k, v]) => `${k}=${v}`).join(',');
            evidence.push(`Selector: ${selector}`);
        } else {
            evidence.push('Selector: <none> (Manual endpoints required)');
        }

        // Check endpoints
        if (!endpoints || !endpoints.subsets || endpoints.subsets.length === 0) {
            evidence.push('Endpoints: 0 found');
        } else {
            // Check for notReadyAddresses
            endpoints.subsets.forEach((subset: V1EndpointSubset) => {
                if (subset.notReadyAddresses && subset.notReadyAddresses.length > 0) {
                    evidence.push(`Found ${subset.notReadyAddresses.length} matching pods, but they are NOT READY.`);
                }
            });
        }

        let likelyCause = mode.commonCauses[0]; // Selector mismatch
        // Refined logic would check if pods actually exist, but for now we look at evidence
        if (endpoints && endpoints.subsets?.some((s: V1EndpointSubset) => s.notReadyAddresses?.length)) {
            likelyCause = 'Pods match the selector but are failing readiness probes';
        }

        return {
            summary: `Service ${service.metadata?.name} has no healthy endpoints to route traffic to.`,
            meaning: mode.meaning,
            likelyCause,
            evidence,
            impact: 'All traffic to this Service will fail (connection refused or timeout).',
            nextChecks: mode.nextChecks
        };
    }

    render(explanation: Explanation): void {
        console.log(chalk.bold.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
        console.log(chalk.bold.red('FAILURE DETECTED'));
        console.log(chalk.bold.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

        console.log(chalk.bold('SUMMARY:'));
        console.log(explanation.summary + '\n');

        console.log(chalk.bold('MEANING:'));
        console.log(explanation.meaning + '\n');

        console.log(chalk.bold('LIKELY CAUSE:'));
        console.log(chalk.yellow(explanation.likelyCause) + '\n');

        console.log(chalk.bold('EVIDENCE:'));
        explanation.evidence.forEach(e => console.log(chalk.gray(`  • ${e}`)));
        console.log();

        console.log(chalk.bold('IMPACT:'));
        console.log(explanation.impact + '\n');

        console.log(chalk.bold('NEXT CHECKS:'));
        explanation.nextChecks.forEach((check, i) =>
            console.log(chalk.green(`  ${i + 1}. ${check}`))
        );

        console.log(chalk.bold.cyan('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));
    }
}
