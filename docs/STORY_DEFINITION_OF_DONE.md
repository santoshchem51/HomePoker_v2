# Story Definition of Done - PokePot Project

## Critical Requirements for Story Completion

**Every story MUST meet ALL criteria below before being marked as complete. NO EXCEPTIONS.**

## 📋 Mandatory Completion Criteria

### 1. ✅ Code Implementation
- [ ] All acceptance criteria implemented and working
- [ ] Code follows project coding standards
- [ ] No breaking changes to existing functionality
- [ ] All edge cases handled with proper error messages

### 2. 🧪 Testing Requirements
- [ ] Unit tests written and passing
- [ ] Integration tests passing
- [ ] Manual testing completed for all acceptance criteria
- [ ] No test failures or warnings

### 3. 📱 **MANDATORY: Visual Validation & Documentation**

**Every story MUST include comprehensive visual evidence demonstrating the actual PokePotExpo React Native application functionality.**

#### Required Visual Evidence:
- [ ] **Screenshots**: High-quality images of all UI states and key interactions
- [ ] **Screen Recordings**: Video demonstrations of complete user workflows
- [ ] **Real App Testing**: All evidence must show the actual PokePotExpo app, never mockups or HTML demos
- [ ] **Multiple Scenarios**: Happy path, error cases, and edge conditions demonstrated
- [ ] **Cross-Platform Testing**: Evidence from both mobile and web versions when applicable

#### Visual Documentation Standards:
- [ ] All screenshots saved with descriptive filenames in `/tmp/playwright-mcp-output/`
- [ ] Each major feature demonstrated end-to-end with visual proof
- [ ] UI interactions shown with before/after states
- [ ] Error handling and validation messages captured
- [ ] Mobile-specific interactions (touch, swipe, alerts) documented

#### Mandatory Tools Usage:
- [ ] **Playwright-MCP**: For web browser automation and screenshot capture
- [ ] **Mobile-MCP**: For mobile device testing and interaction recording
- [ ] **Real Device Testing**: Actual app installation and usage scenarios

### 4. 📚 Documentation Updates
- [ ] Story file updated with QA results and visual evidence
- [ ] Any new features documented in relevant architecture files
- [ ] Breaking changes documented with migration notes
- [ ] README updated if user-facing changes

### 5. 🔍 Code Quality
- [ ] TypeScript compilation successful with no errors
- [ ] ESLint/Prettier formatting applied
- [ ] No console errors or warnings in production build
- [ ] Performance impact assessed and documented

### 6. 🚀 Production Readiness
- [ ] Feature works in production build
- [ ] No hardcoded development values
- [ ] Environment-specific configurations handled
- [ ] Security considerations reviewed

## 🚫 Blocking Criteria - Story CANNOT be Complete if:

- Visual evidence shows HTML mockups instead of real React Native app
- Screenshots are missing for any major feature or user flow
- Error scenarios are not visually demonstrated
- Mobile interactions are not properly captured
- Only code changes are provided without visual validation
- Test failures exist in any environment
- Breaking changes are introduced without proper documentation

## ✨ Quality Gates

### Before Story Submission:
1. Developer runs full visual validation using Playwright and Mobile MCP tools
2. All required screenshots and recordings captured
3. Story documentation updated with visual evidence
4. QA validation completed with authentic app demonstration

### During Story Review:
1. Reviewer verifies all visual evidence shows real PokePotExpo app
2. All acceptance criteria visually demonstrated and confirmed working
3. User experience meets design and functionality requirements
4. No misrepresentation of app capabilities or interface

## 📖 Reference Documents

- **Visual Testing Requirements**: `/docs/VISUAL_TESTING_REQUIREMENTS.md`
- **Story 1.8 Example**: Complete visual validation example in `/docs/stories/1.8.story.md`
- **Architecture Standards**: `/docs/architecture/testing-strategy.md`

## 🔄 Enforcement

**This Definition of Done is mandatory for ALL stories starting immediately. Stories that do not meet these criteria will be returned for completion.**

**The visual validation requirement was established in Story 1.8 and is now a permanent requirement for all future development work.**

---

*Last Updated: 2025-08-12*  
*Applies to: All stories in Epic 2 and beyond*  
*Established by: Story 1.8 Visual Validation and Workflow Documentation*