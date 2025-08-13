# Development Workflow

Define the development setup and workflow for PokePot's React Native mobile application:

## Local Development Setup

### Prerequisites
```bash

## Story Development Process

### Visual Validation Requirements (MANDATORY)

**As of Story 1.8, all stories MUST include comprehensive visual validation before completion.**

#### Required Steps for Every Story:
1. **Implement Feature**: Complete all code changes and functionality
2. **Run Real App**: Start the actual PokePotExpo React Native application
3. **Capture Evidence**: Use Playwright-MCP and Mobile-MCP tools to document:
   - Screenshots of all UI states and interactions
   - Video recordings of complete user workflows
   - Error handling and validation scenarios
   - Mobile-specific interactions (alerts, touch gestures)
4. **Update Documentation**: Add visual evidence to story files
5. **QA Review**: Verify all evidence shows authentic app behavior

#### Tools Required:
- **Playwright-MCP**: For web browser automation and screenshot capture
- **Mobile-MCP**: For mobile device testing and interaction recording
- **Real Device Setup**: Actual app installation and usage scenarios

#### Blocking Criteria:
- ❌ HTML mockups or non-native demonstrations
- ❌ Missing screenshots for key user flows
- ❌ Code-only validation without visual proof
- ❌ Incomplete error scenario documentation

**See `/docs/STORY_DEFINITION_OF_DONE.md` for complete requirements.**

#### 📚 Visual Validation Resources:
- **Step-by-Step Guide**: `/docs/VISUAL_VALIDATION_GUIDE.md`
- **Real Example**: `/docs/VISUAL_VALIDATION_EXAMPLE.md`
- **Quick Reference**: `/docs/VISUAL_VALIDATION_CHEATSHEET.md`
- **Troubleshooting**: `/docs/VISUAL_VALIDATION_TROUBLESHOOTING.md`

### Prerequisites