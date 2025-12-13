# Changelog

All notable changes to Hiios will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0-alpha] - 2025-12-14

### Added

- 🎉 Initial release of Hiios CLI
- `hiios explain pod` command for diagnosing pod failures
- CrashLoopBackOff failure mode detection with intelligent cause analysis
- Evidence-based narrative generation from pod facts
- Smart log parsing to identify likely root causes:
  - Environment variable issues
  - Configuration problems
  - Dependency connection failures
  - Application code panics/exceptions
- Kubernetes API client wrapper with error handling
- Pod fact gatherer collecting:
  - Pod status and phase
  - Container statuses and restart counts
  - Events related to the pod
  - Recent container logs (last 50 lines)
- Beautiful terminal output with chalk formatting
- Comprehensive documentation (README, CONTRIBUTING, LICENSE)
- MIT License

### Philosophy Established

- Understanding over automation
- Clarity over metrics
- Narrative over dashboards
- Human cognition over system control
- No automatic remediation - only explanation and guidance

### Tested Against

- K3s cluster running on Ubuntu VM
- Real production workloads
- Intentionally broken test pods
- Multi-restart scenarios

### Known Limitations

- Only CrashLoopBackOff failure mode currently implemented
- Best results with single-container pods (multi-container improving)
- Requires kubectl access to cluster
- No automated tests yet (manual testing only)

## [Unreleased]

### Planned for v0.2

- ImagePullBackOff failure mode detection
- OOMKilled failure mode detection
- ServiceNoEndpoints failure mode detection
- `hiios scan` command for namespace-wide problem overview
- Improved multi-container pod support
- Better evidence correlation across events and logs
