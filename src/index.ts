
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
        if (type !== 'pod') {
            console.log(chalk.yellow('Only pod explanation is supported in this v0.1 preview.'));
            return;
        }

        try {
            const client = new K8sClient();
            const gatherer = new PodGatherer(client);

            const facts = await gatherer.gather(options.namespace, name);

            const isCrashLoop = checkMatch(crashLoopBackOffMode, facts);

            if (isCrashLoop) {
                const narrator = new Narrator();
                const explanation = narrator.explainCrashLoop(crashLoopBackOffMode, facts);
                narrator.render(explanation);
            } else {
                console.log(chalk.green('\nNo specific failure mode detected (or not yet implemented).'));
                console.log(chalk.gray(`Pod Status: ${facts.pod.status?.phase}`));
                console.log(chalk.gray('This feature is under development.\n'));
            }

        } catch (err: any) {
            console.error(chalk.red(`Error: ${err.message}`));
        }
    });

program.parse();
