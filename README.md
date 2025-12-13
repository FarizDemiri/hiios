# Hiios - Holistic Infrastructure Interpreter Open Source

> Translate Kubernetes chaos into human understanding

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Status](https://img.shields.io/badge/Status-v0.1.0--alpha-orange.svg)]()
[![Working](https://img.shields.io/badge/Working-Yes!-brightgreen.svg)]()

## What is Hiios?

Hiios is an interpretation layer for Kubernetes. It doesn't automate—it **explains**.

Instead of drowning you in metrics, logs, and YAML, Hiios tells you:

- **What** is actually happening
- **Why** it's happening  
- **What to do** next

## The Problem

Most infrastructure tools expose **data**. Hiios exposes **meaning**.

When a pod fails, you typically get:

- ❌ CrashLoopBackOff status
- ❌ 47 events in the last 5 minutes
- ❌ 10,000 lines of logs to sift through
- ❌ Dashboards showing red squares everywhere

With Hiios, you get:

- ✅ "Your application is exiting because DATABASE_URL is not set"
- ✅ "This is a configuration issue, not a Kubernetes problem"
- ✅ "Check if the 'db-config' ConfigMap exists in this namespace"

## Philosophy

**Core Principles:**

- **Understanding over automation**
- **Clarity over metrics**
- **Narrative over dashboards**
- **Human cognition over system control**

Hiios will never "fix" things automatically. It only explains and guides.

**What Hiios is NOT:**

- Not a Kubernetes orchestrator
- Not an automation engine
- Not a replacement for kubectl, monitoring tools, or runbooks
- Not a dashboard or web UI

Hiios is purely an **interpretation layer**.

## Status

✅ **v0.1.0-alpha** - First working release! (December 2025)

**Currently working:**

- [x] CLI framework with commander
- [x] Kubernetes API client wrapper
- [x] Pod fact gatherer with events and logs
- [x] CrashLoopBackOff failure mode detection
- [x] Intelligent narrative generation
- [x] Evidence-based diagnosis from log analysis
- [x] Beautiful terminal output

**Ready to use for:**

- ✅ Diagnosing CrashLoopBackOff failures
- ✅ Understanding why pods are restarting
- ✅ Getting actionable next steps without diving through logs

**Coming in v0.2:**

- ⏳ ImagePullBackOff detection
- ⏳ OOMKilled detection
- ⏳ ServiceNoEndpoints detection
- ⏳ `hiios scan` command for namespace overview

## Installation

### Prerequisites

- Node.js 18.x or higher
- kubectl configured to access your Kubernetes cluster
- A Kubernetes cluster (K3s, minikube, EKS, GKE, AKS, etc.)

### Install from source (v0.1.0-alpha)

```bash
# Clone the repository
git clone https://github.com/farizdemiri/hiios.git
cd hiios

# Install dependencies
npm install

# Build the project
npm run build

# Run it
node dist/index.js explain pod <pod-name> -n <namespace>
```

### Quick Test

Try it out with a test pod to see Hiios in action:

```bash
# Create a test namespace
kubectl create namespace hiios-test

# Create a pod that will crash (missing env var)
kubectl run test-crashloop \
  --image=busybox \
  --namespace=hiios-test \
  -- sh -c "echo 'Error: DATABASE_URL is not defined'; exit 1"

# Wait for it to crash (about 30 seconds)
sleep 30

# Run Hiios to see the magic ✨
node dist/index.js explain pod test-crashloop -n hiios-test
```

You should see a detailed explanation of why the pod is crashing!

*npm package coming soon - this is an early alpha release for testing*

## Example Output

Here's real output from Hiios diagnosing a CrashLoopBackOff failure:

```bash
$ node dist/index.js explain pod test-crashloop -n hiios-test
Gathering facts for pod test-crashloop in hiios-test...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAILURE DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
Pod test-crashloop in namespace hiios-test is in CrashLoopBackOff with 5 restarts.

MEANING:
The application starts but exits immediately or repeatedly. Kubernetes keeps 
restarting it, but the same failure repeats.

LIKELY CAUSE:
Missing or incorrect environment variable

EVIDENCE:
  • Container has restarted 5 times
  • Current state: CrashLoopBackOff
  • Last exit code: 1
  • Recent log shows: "Error: DATABASE_URL environment variable is not defined"
  • 1 back-off restart events in recent history

IMPACT:
This pod cannot serve traffic. This appears to be a standalone pod, so the 
service is likely down.

NEXT CHECKS:
  1. Read the last 50 lines of logs
  2. Check if required ConfigMaps/Secrets are present
  3. Verify environment variables match application requirements
  4. Test if downstream dependencies are reachable

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Notice how Hiios:

- ✅ Identified the exact problem from logs
- ✅ Explained what's actually happening
- ✅ Provided evidence to back up the diagnosis
- ✅ Suggested concrete next steps

Compare this to `kubectl get pod` which just shows "CrashLoopBackOff" 🤷

## Roadmap

### v0.1.0-alpha ✅ (December 2025 - SHIPPED!)

- ✅ CLI with `explain pod` command
- ✅ CrashLoopBackOff failure mode detector
- ✅ Intelligent cause detection from log parsing
- ✅ Evidence-based narrative output
- ✅ Terminal formatting with colors
- ✅ Zero cluster installation required
- ✅ Real-world testing on K3s cluster

### v0.2 (Q1 2026 - In Progress)

- ⏳ ImagePullBackOff detection
- ⏳ OOMKilled detection  
- ⏳ ServiceNoEndpoints detection
- ⏳ `hiios scan` command for namespace overview
- ⏳ Better multi-container pod support
- ⏳ Configuration file support

### v0.3+ (Future)

- PVC and storage issue detection
- Ingress troubleshooting
- StatefulSet support
- Dependency graph analysis
- Historical pattern recognition
- Multi-cluster support
- Runbook matching and suggestions

## Architecture

See `docs/architecture.md` for details.

## Why "Hiios"?

**H**olistic **I**nfrastructure **I**nterpreter **O**pen **S**ource
Also sounds like "Helios" (Greek sun god) — bringing light to dark infrastructure. ☀️

## Contributing

This project just started in December 2025! Contributions are very welcome.

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

## Inspiration

Hiios is inspired by:

- Holistic systems thinking
- SRE diagnostic reasoning
- The belief that complexity should collapse into understanding, not overwhelm
- The observation that most outages are prolonged by misclassification, not lack of runbooks

## License

MIT License - see [LICENSE](LICENSE) for details.

## Author

Created by [Your Name] as a contribution to the SRE and DevOps community.
