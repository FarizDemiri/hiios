
import { program } from 'commander';
import chalk from 'chalk';
import { K8sClient } from './k8s/client.js';
import { PodGatherer } from './gatherers/pod-gatherer.js';
import { crashLoopBackOffMode } from './catalog/modes/crashloop.js';
import { PodFacts } from './gatherers/pod-gatherer.js';
import { Narrator } from './narrator/explain.js';

// Simple matcher logic for now - move to src/catalog/matcher.ts later
function checkMatch(mode: any, facts: PodFacts): boolean {
    for (const signal of mode.signals) {
        if (!signal.required) continue;

        let matched = false;
        if (typeof signal.pattern === 'function') {
            matched = signal.pattern(facts);
        } else if (signal.source === 'event') {
            // Simple string match on event messages
            matched = facts.events.some(e => e.message && e.message.includes(signal.pattern));
        }

        if (!matched && signal.required) return false;
    }
    return true;
}

program
    .name('hiios')
    .description('Holistic Infrastructure Interpreter - Translate Kubernetes chaos into human understanding')
    .version('0.1.0');

program.command('explain')
    .argument('<type>', 'Resource type (pod, svc)')
    .argument('<name>', 'Resource name')
    .option('-n, --namespace <namespace>', 'Kubernetes namespace', 'default')

    .action(async (type, name, options) => {
        try {
            const client = new K8sClient();

            if (type === 'pod') {
                const gatherer = new PodGatherer(client);
                const facts = await gatherer.gather(options.namespace, name);

                // Use generic matcher
                // Import modes here or pass to matcher
                const { allFailureModes } = await import('./catalog/index.js');
                // Filter for pod modes (basic check: do they have signals for pod facts?)
                // For now, assume all modes in index are relevant or checks will simply fail gracefully

                const { Matcher } = await import('./catalog/matcher.js');
                const matches = Matcher.match(facts, allFailureModes);

                if (matches.length > 0) {
                    const topMatch = matches[0];
                    const narrator = new Narrator();
                    let explanation;

                    switch (topMatch.mode.id) {
                        case 'crash-loop-back-off':
                            explanation = narrator.explainCrashLoop(topMatch.mode, facts);
                            break;
                        case 'image-pull-back-off':
                            explanation = narrator.explainImagePull(topMatch.mode, facts);
                            break;
                        case 'oom-killed':
                            explanation = narrator.explainOOM(topMatch.mode, facts);
                            break;
                        default:
                            console.log(chalk.yellow(`Detected ${topMatch.mode.name} but no specific explanation template exists yet.`));
                            return;
                    }
                    if (explanation) narrator.render(explanation);
                } else {
                    console.log(chalk.green('\nNo specific failure mode detected.'));
                    console.log(chalk.gray(`Pod Status: ${facts.pod.status?.phase}`));
                    console.log(chalk.gray('The pod appears to be healthy or has an unknown issue.\n'));
                }

            } else if (type === 'svc') {
                const { ServiceGatherer } = await import('./gatherers/service-gatherer.js');
                const gatherer = new ServiceGatherer(client);
                const facts = await gatherer.gather(options.namespace, name);

                const { allFailureModes } = await import('./catalog/index.js');
                const { Matcher } = await import('./catalog/matcher.js');

                // Only check service modes
                const svcModes = allFailureModes.filter(m => m.id === 'service-no-endpoints');
                const matches = Matcher.match(facts, svcModes);

                if (matches.length > 0) {
                    const topMatch = matches[0];
                    const narrator = new Narrator();
                    if (topMatch.mode.id === 'service-no-endpoints') {
                        const explanation = narrator.explainServiceNoEndpoints(topMatch.mode, facts);
                        narrator.render(explanation);
                    }
                } else {
                    console.log(chalk.green('\nService appears healthy (endpoints exist).'));
                }

            } else {
                console.log(chalk.yellow(`Resource type '${type}' is not supported. Use 'pod' or 'svc'.`));
            }

        } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
            if (err.message.includes('NotFound')) {
                console.log(chalk.gray(`Tip: Check if the ${type} '${name}' exists in namespace '${options.namespace}'.`));
            }
        }
    });

program.parse();
