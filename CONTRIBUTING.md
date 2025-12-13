# Contributing to Hiios

Thank you for your interest in contributing to Hiios! This project started in December 2025 and is in very early development.

## Project Status

We're currently building the v0.1 foundation. The codebase is evolving rapidly, so expect changes.

## Ways to Contribute

### 🧪 Testing & Feedback

- Test Hiios against your real Kubernetes clusters
- Report bugs or confusing explanations
- Share edge cases we haven't considered
- Suggest improvements to narrative clarity

### 💡 Ideas & Suggestions

- Propose new failure modes to detect
- Suggest better diagnostic workflows
- Share your SRE/operations experience
- Recommend improvements to output format

### 📖 Documentation

- Improve README clarity
- Add examples of failure scenarios
- Document your debugging workflows
- Write tutorials or guides

### 💻 Code Contributions

- Implement new failure mode detectors
- Improve pattern matching logic
- Enhance the Kubernetes API client
- Add test coverage
- Fix bugs

## How to Contribute Code

1. **Fork the repository**

```bash
   git clone https://github.com/YOUR-USERNAME/hiios.git
   cd hiios
```

2. **Create a feature branch**

```bash
   git checkout -b feature/improve-crashloop-detection
```

3. **Make your changes**
   - Keep code simple and readable
   - Add comments for complex logic
   - Follow existing code style
   - Test against real Kubernetes resources

4. **Commit your changes**

```bash
   git add .
   git commit -m "Improve CrashLoopBackOff detection for init containers"
```

5. **Push to your fork**

```bash
   git push origin feature/improve-crashloop-detection
```

6. **Open a Pull Request**
   - Describe what you changed and why
   - Reference any related issues
   - Include example output if relevant

## Code Style Guidelines

### General Principles

- **Simplicity over cleverness** - readable code is better than "smart" code
- **Explicit over implicit** - be clear about what your code does
- **Comments for the "why"** - code shows "what", comments explain "why"

### TypeScript Specifics

- Use TypeScript's type system properly
- Avoid `any` types when possible
- Prefer interfaces over type aliases for object shapes
- Use meaningful variable and function names

### Commit Messages

Good commit messages:

- ✅ `Add detection for OOMKilled in init containers`
- ✅ `Fix event correlation for multi-container pods`
- ✅ `Improve narrative template for ImagePullBackOff`
- ✅ `Update docs: add architecture diagram`

Bad commit messages:

- ❌ `fixed stuff`
- ❌ `updates`
- ❌ `wip`
- ❌ `asdf`

## Adding a New Failure Mode

To add a new failure mode detector:

1. Create a new file in `src/catalog/modes/` (e.g., `dns-failure.ts`)
2. Define the failure mode structure:

```typescript
   export const dnsFailureMode: FailureMode = {
     id: 'dns-failure',
     name: 'DNS Resolution Failure',
     meaning: 'Clear explanation of what this means...',
     commonCauses: [...],
     signals: [...],
     nextChecks: [...]
   };
```

3. Implement the matcher function
4. Register it in `src/catalog/index.ts`
5. Add documentation to `docs/failure-modes.md`
6. Test against real scenarios

## Testing

Currently, testing is manual:

- Run Hiios against real broken pods in a test cluster
- Verify the explanation is accurate and helpful
- Check that evidence matches the failure mode

Automated tests are coming in v0.2.

## Questions or Problems?

- **Open an issue** - for bugs, questions, or feature requests
- **Start a discussion** - for broader topics or ideas
- **Be patient** - the maintainer is learning too!

## Code of Conduct

### Be Kind and Respectful

- Treat everyone with respect and kindness
- Welcome newcomers and help them learn
- Assume good intentions
- Provide constructive feedback

### Be Collaborative

- Share knowledge openly
- Help others improve their contributions
- Credit others for their work
- Work together to solve problems

### Unacceptable Behavior

- Harassment or discrimination of any kind
- Trolling or insulting comments
- Personal attacks
- Publishing others' private information

## Recognition

Contributors will be recognized in:

- The project README
- Release notes
- The CONTRIBUTORS file (coming soon)

## License

By contributing to Hiios, you agree that your contributions will be licensed under the MIT License.

---

Thank you for helping make Hiios better! Every contribution, no matter how small, is valuable.
