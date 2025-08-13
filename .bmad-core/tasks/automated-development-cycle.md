# Automated Development Cycle Task

## Purpose

Execute the complete BMad Core Development Cycle automatically while maintaining safety mechanisms and preventing context bloat. This task implements the exact workflow from the BMad Method user guide with proper orchestration.

## CRITICAL SAFETY RULES

1. **NEVER exceed max_cycles limit (default: 10 per session)**
2. **ALWAYS halt if any regression tests fail**
3. **REQUIRE user approval at all safety gates**
4. **COMPACT conversation when approaching context limits**
5. **VALIDATE all dependencies before proceeding**

## Execution Workflow

### Phase 1: SM (Scrum Master) Phase

#### 1.1 Initialize and Validate Environment
- Load `.bmad-core/core-config.yaml` and validate all required paths exist
- Check `devStoryLocation`, `prdShardedLocation`, `architectureShardedLocation`
- Verify epic files exist in PRD location
- Initialize safety counters: `cycle_count = 0`, `context_length = 0`

#### 1.2 Review Previous Story Context
- Find highest numbered story in `devStoryLocation` (e.g., `2.2.story.md`)
- If story exists, read Dev Agent Record sections:
  - Completion Notes and Debug Log References
  - Implementation deviations and technical decisions
  - Challenges encountered and lessons learned
- Extract insights for informing next story preparation

#### 1.3 Identify Next Story
- Follow `create-next-story` task logic to identify next sequential story
- **CRITICAL**: If epic is complete, HALT and ask user which epic to begin
- **CRITICAL**: If previous story is not "Done", HALT and report incomplete story
- Announce identified story: "Next story for automation: {epicNum}.{storyNum}"

#### 1.4 Story Creation with Safety Gates
- Execute `create-next-story` task completely
- **SAFETY GATE**: User must approve story draft before proceeding
- Optional: Execute `validate-next-story` if user requests PO validation
- **SAFETY GATE**: User must approve proceeding to development phase

### Phase 2: Dev (Developer) Phase  

#### 2.1 Development Environment Setup
- Load story file and all `devLoadAlwaysFiles` from core-config
- Verify story status is not "Draft" (must be approved)
- Initialize development phase tracking

#### 2.2 Sequential Task Execution (Following Flow Diagram Steps D→E)
Execute `*develop-story` command following exact agent behavior:
- **Step D: "Dev: Sequential Task Execution"**
  - Read first/next task from Tasks/Subtasks section
  - **Step E: "Dev: Implement Tasks + Tests"**
    - Implement task and all its subtasks
    - Write comprehensive tests for implemented functionality
  - **Step F: "Dev: Run All Validations"** 
    - Execute `*run-tests` command explicitly
    - Run lint, typecheck, unit tests for current task
    - **CRITICAL**: Only mark task [x] if ALL validations pass
    - Update story File List with new/modified/deleted files
  - Repeat D→E→F for all tasks until complete

#### 2.3 Story Completion and Status Update (Following Flow Diagram Step G)
- **Step G: "Dev: Mark Ready for Review + Add Notes"**
  - Execute `story-dod-checklist` when all tasks marked [x]
  - Verify all acceptance criteria are met
  - Ensure File List is complete and accurate
  - Add completion notes to Dev Agent Record section
  - **CRITICAL**: Execute: Set story status to "Ready for Review"
  - **SAFETY GATE**: User decision on QA review vs direct approval

### Phase 3: QA (Quality Assurance) Phase

#### 3.1 QA Review Decision Gate
- **USER CHOICE**: "Request QA Review" or "Approve Without QA"
- If "Approve Without QA": Skip to Phase 4
- If "Request QA Review": Continue to 3.2

#### 3.2 Senior Developer Review (Following Flow Diagram Steps I→J→L)
- **Step I: "QA: Senior Dev Review + Active Refactoring"**
  - Execute `*review {story}` command for current story
- **Step J: "QA: Review, Refactor Code, Add Tests, Document Notes"**
  - Apply code refactoring and improvements
  - Add comprehensive test coverage
  - Update QA Results section in story file
- **Step L: "QA Decision"**
  - **Option 1**: "Needs Dev Work" → Return to Phase 2 (Step D)
  - **Option 2**: "Approved" → Continue to Phase 4
  - **SAFETY GATE**: QA must make explicit decision before proceeding

### Phase 4: Commit Phase (Following Flow Diagram Steps M→N→K)

#### 4.1 Final Regression Validation (Step M)
- **Step M: "IMPORTANT: Verify All Regression Tests and Linting are Passing"**
  - Execute ALL regression tests (separate from per-task validations):
    - `npm run lint` (or equivalent from core-config)
    - `npm run typecheck` (or equivalent from core-config)  
    - `npm test` (full test suite)
  - **HALT CONDITION**: If ANY test fails, STOP automation and report failures
  - User must manually fix issues before automation can resume

#### 4.2 Git Commit Execution (Step N)
- **Step N: "IMPORTANT: COMMIT YOUR CHANGES BEFORE PROCEEDING!"**
  - **SAFETY GATE**: User must explicitly authorize git commit
  - Execute git operations:
    ```bash
    git add .
    git commit -m "{story_id}: {story_title}
    
    {completion_summary}
    
    🤖 Generated with BMad Development Orchestrator
    Co-Authored-By: BMad DevCycle <noreply@bmadcode.com>"
    ```

#### 4.3 Story Completion (Step K)  
- **Step K: "Mark Story as Done"**
  - Set story status to "Done"
  - Add completion timestamp to story file
  - Update story completion notes

### Phase 5: Loop Control and Safety Management

#### 5.1 Safety Limit Checks
- Increment `cycle_count += 1`
- Check if `cycle_count >= max_cycles` (HALT if exceeded)
- Measure conversation context length
- Check if `context_length >= force_compact_threshold`

#### 5.2 Context Management
- If approaching context limits, execute conversation compacting:
  - Preserve: Current story, safety state, progress summary
  - Archive: Previous story details, verbose logs
  - Reset: Agent conversation history
- Update context tracking metrics

#### 5.3 Cycle Continuation Decision
- **SAFETY GATE**: User must approve continuing to next cycle
- If approved: Return to Phase 1 for next story
- If declined: Enter idle state and await user commands

## Error Recovery Procedures

### Test Failure Recovery
1. HALT automation immediately
2. Report specific test failures with file paths and error messages
3. Suggest potential fixes based on error analysis
4. Require user to manually resolve issues
5. Allow resume only after user confirms fixes applied

### Missing Dependency Recovery
1. HALT automation and report missing files/paths
2. Guide user through dependency resolution
3. Validate all dependencies before allowing resume
4. Update core-config if necessary

### Context Overflow Recovery
1. Force conversation compacting immediately
2. Preserve essential context only
3. Continue automation with compacted context
4. Log compacting action for user awareness

### Safety Limit Recovery
1. HALT all automation when limits exceeded
2. Report current state and safety metrics
3. Require user review and explicit authorization to continue
4. Reset safety counters only with user confirmation

## Progress Reporting

Throughout execution, provide:
- Current phase and progress percentage
- Safety metrics (cycles, context length, violations)
- Story completion status and file changes
- Next planned actions and required user approvals
- Any warnings or issues encountered

## Success Criteria

- Story successfully moves from "Draft" → "Ready for Review" → "Done"
- All regression tests pass before commit
- Git commit completed with proper message format
- Safety limits respected throughout process
- User approval obtained at all required gates
- Context managed efficiently without overflow