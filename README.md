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

## Status: v0.2 Implementation

Hiios v0.2 now detects core failure modes for Pods and Services!

**Currently supported failure modes:**

- **CrashLoopBackOff**: Analyzes container exit codes and logs (even if K8s hasn't updated status yet).
- **ImagePullBackOff**: Detects registry authentication, missing tags, and network issues.
- **OOMKilled**: Identifies memory limit violations (including exit code 137).
- **ServiceNoEndpoints**: Inspects Services to explain why connections fail (selector mismatch, failing probes).

**Core Features:**

- **Zero Configuration**: Reads from your current `kubectl` context.
- **Narrative Output**: Explains *what* is wrong, *why* it's happening, and *what* to check next.

## Roadmap

### v0.2 (December 2025 - SHIPPED!)

- ✅ ImagePullBackOff detection
- ✅ OOMKilled detection
- ✅ ServiceNoEndpoints detection
- ✅ `hiios explain svc <name>` support

### v0.3+ (Future)

- `hiios scan` command
- PVC and storage issue detection
- Ingress troubleshooting

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

## Example Outputs

Hiios v0.2.0 can now detect and explain 4 common Kubernetes failure modes. Here are real outputs from our test cluster:

### 1. CrashLoopBackOff - Application Exits Immediately

```bash
$ hiios explain pod test-crashloop -n hiios-test

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAILURE DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
Pod test-crashloop in namespace hiios-test is in CrashLoopBackOff with 26 restarts.

MEANING:
The application starts but exits immediately or repeatedly. Kubernetes keeps 
restarting it, but the same failure repeats.

LIKELY CAUSE:
Missing or incorrect environment variable

EVIDENCE:
  • Container has restarted 26 times
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

### 2. ImagePullBackOff - Cannot Pull Container Image

```bash
$ hiios explain pod test-imagepull -n hiios-test

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAILURE DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
Pod test-imagepull cannot start because it fails to pull the image 
'this-does-not-exist:v1.0'.

MEANING:
Kubernetes cannot retrieve the container image from the registry. The pod 
cannot start until the image is successfully pulled.

LIKELY CAUSE:
Private registry credentials (imagePullSecrets) are missing or incorrect

EVIDENCE:
  • Container 'test-imagepull' status: ImagePullBackOff
  • Image: this-does-not-exist:v1.0
  • Event: Failed to pull image... pull access denied, repository does not exist

IMPACT:
The pod cannot start. No containers are running.

NEXT CHECKS:
  1. Verify the image name and tag are correct
  2. Check if the image exists in the registry
  3. For private registries: verify imagePullSecrets are configured
  4. Check network connectivity to the registry
  5. Check for registry rate limits

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 3. OOMKilled - Out of Memory

```bash
$ hiios explain pod test-oom -n hiios-test

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAILURE DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
Container in pod test-oom was killed because it ran out of memory (OOMKilled).

MEANING:
The container exceeded its memory limit and was terminated by Kubernetes. This 
is a resource constraint issue, not an application crash.

LIKELY CAUSE:
Possible memory leak (frequent restarts)

EVIDENCE:
  • Container 'stress' was terminated with reason: OOMKilled
  • Exit Code: 137
  • Restart Count: 7

IMPACT:
The container crashes when it exceeds memory limits. If in a deployment, this 
causes degraded availability.

NEXT CHECKS:
  1. Compare memory limit vs memory request
  2. Monitor actual memory usage over time
  3. Investigate application code for memory leaks
  4. Consider increasing memory limit if workload legitimately needs more
  5. Review if traffic spikes correlate with OOMKills

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### 4. ServiceNoEndpoints - No Backend Pods

```bash
$ hiios explain svc test-svc -n hiios-test

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
FAILURE DETECTED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

SUMMARY:
Service test-svc has no healthy endpoints to route traffic to.

MEANING:
A Service exists but has no healthy backend pods to route traffic to. All 
requests to this Service will fail.

LIKELY CAUSE:
Service selector doesn't match any pod labels

EVIDENCE:
  • Service Name: test-svc
  • Namespace: hiios-test
  • Selector: app=test-svc
  • Endpoints: 0 found

IMPACT:
All traffic to this Service will fail (connection refused or timeout).

NEXT CHECKS:
  1. Verify service selector matches pod labels exactly
  2. Check if pods exist with the expected labels
  3. Investigate why matching pods are not ready
  4. Review readiness probe configuration
  5. Ensure pods and service are in the same namespace

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

**Notice how Hiios:**

- ✅ Identifies the exact problem from logs and events
- ✅ Explains what's actually happening (not just status codes)
- ✅ Provides evidence to back up the diagnosis
- ✅ Suggests concrete next steps
- ✅ Uses calm, educational language

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

Created by Fariz Demiroski as a contribution to the SRE and DevOps community.
