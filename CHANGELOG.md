
# Changelog

## [Unreleased]

### Added

- **New Failure Mode**: `ImagePullBackOff` detection (auth, network, missing tags).
- **New Failure Mode**: `OOMKilled` detection (exit code 137, memory limits).
- **New Failure Mode**: `ServiceNoEndpoints` for debugging Service connection failures.
- **CLI Command**: Added `hiios explain svc <name>` support.
- **Matcher Engine**: Intelligent multi-mode matching system sorted by confidence.

### Changed

- Improved `CrashLoopBackOff` detection to distinguish OOMKilled events.
- Refactored `Narrator` to generic interface supporting multiple failure modes.

## [0.2.0] - 2025-12-14

### Added - Major Feature Release! 🎉

**New Failure Modes:**

- **ImagePullBackOff detection** - Diagnoses image pull failures with intelligent cause analysis
  - Identifies authentication issues (missing imagePullSecrets)
  - Detects wrong image names or tags
  - Finds registry connectivity problems
  - Detects Docker Hub rate limiting
- **OOMKilled detection** - Analyzes out-of-memory container terminations
  - Identifies exit code 137 (SIGKILL)
  - Detects memory leaks vs legitimate high usage
  - Compares memory limits vs requests
  - Tracks restart frequency patterns
- **ServiceNoEndpoints detection** - Diagnoses service routing failures
  - Detects selector mismatches
  - Identifies pods failing readiness probes
  - Checks for missing backend pods
  - Analyzes notReadyAddresses

**New Commands:**

- `hiios explain svc <service-name>` - Explain service-level failures

**Improvements:**

- Priority-based failure mode matching (OOMKilled takes precedence over generic CrashLoopBackOff)
- Enhanced evidence collection from Kubernetes events
- Improved log parsing for cause determination
- Type-safe failure mode matching
- Service gatherer for endpoint analysis

### Fixed

- ServiceNoEndpoints now only matches services (not pods)
- Matcher correctly prioritizes specific failures over generic ones
- Better handling of multi-container pods

### Technical

- New `Matcher` class with priority ordering
- New `ServiceGatherer` for service/endpoint facts
- Updated `Narrator` with 3 new explanation methods
- Comprehensive test coverage for all 4 modes

### Documentation

- README updated with real working examples for all 4 failure modes
- Updated roadmap showing v0.2 completion
- Added comparison screenshots

### Tested Against

- K3s cluster (Ubuntu VM)
- Real production scenarios
- All 4 failure modes validated with live pods/services

## [0.1.0-alpha] - 2025-12-13

### Added

- Initial release.
- core `explain pod` command.
- `CrashLoopBackOff` detection logic.
- Intelligent log parsing for root cause analysis.
- Narrative output engine.
