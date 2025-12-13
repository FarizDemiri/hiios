
import chalk from 'chalk';
import { PodFacts } from '../gatherers/pod-gatherer.js';
import { FailureMode } from '../catalog/types.js';

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
