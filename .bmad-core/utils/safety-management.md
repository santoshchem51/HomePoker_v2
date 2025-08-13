# Safety Management Utility

## Purpose

Implement comprehensive safety mechanisms to prevent infinite loops, context bloating, and dangerous automation behaviors during the BMad development lifecycle.

## Safety Limits and Thresholds

### Cycle Limits
```yaml
max_cycles_per_session: 10        # Hard limit on automation cycles
max_stories_per_epic: 20          # Limit stories per epic before requiring review
max_consecutive_failures: 3       # Max failures before requiring intervention
max_automation_time: 7200         # Max automation time (2 hours) before break
```

### Context Limits
```yaml
context_warning_threshold: 40000   # Characters before warning
context_force_threshold: 50000     # Characters before forced compacting
context_critical_threshold: 60000  # Characters before emergency halt
```

### Test and Validation Limits
```yaml
max_test_failures: 5              # Max test failures before halt
max_lint_errors: 10               # Max lint errors before halt
max_typecheck_errors: 15          # Max typecheck errors before halt
test_timeout: 300                 # Max seconds for test execution
```

## Safety Gate Definitions

### User Approval Gates
These require explicit user confirmation before proceeding:

1. **Story Validation Gate**
   - Trigger: After SM creates story draft
   - Purpose: User reviews and approves story before development
   - Options: Approve, Request Changes, Cancel Automation

2. **QA Review Decision Gate**
   - Trigger: After dev marks story "Ready for Review"
   - Purpose: User decides on QA review vs direct approval
   - Options: Request QA Review, Approve Without QA, Cancel

3. **Commit Authorization Gate**
   - Trigger: After all tests pass and before git commit
   - Purpose: User authorizes code changes to be committed
   - Options: Authorize Commit, Review Changes, Cancel

4. **Cycle Continuation Gate**
   - Trigger: After story marked "Done" and before next cycle
   - Purpose: User approves continuing automation to next story
   - Options: Continue Automation, Pause, Stop

### Automatic Safety Triggers
These halt automation automatically without user input:

1. **Test Failure Halt**
   - Trigger: Any regression test fails
   - Action: Immediate halt, report failures
   - Recovery: User must fix issues manually

2. **Context Overflow Halt**
   - Trigger: Context exceeds critical threshold
   - Action: Emergency compacting or halt
   - Recovery: Context management required

3. **Cycle Limit Halt**
   - Trigger: Max cycles per session exceeded
   - Action: Automatic halt with safety report
   - Recovery: User review and counter reset

4. **Dependency Missing Halt**
   - Trigger: Required files or configuration missing
   - Action: Halt with dependency report
   - Recovery: User must resolve dependencies

## Safety State Tracking

### Session State
```yaml
session:
  start_time: "2024-01-01T10:00:00Z"
  cycle_count: 3
  automation_active: true
  current_phase: "dev"
  current_story: "2.3.story.md"
  context_length: 42000
  safety_violations: []
```

### Cycle State
```yaml
current_cycle:
  cycle_number: 3
  start_time: "2024-01-01T10:45:00Z"
  current_phase: "dev"
  phases_completed: ["sm", "dev"]
  phases_remaining: ["qa", "commit"]
  safety_checks_passed: 8
  user_approvals_obtained: 2
```

### Error State
```yaml
error_tracking:
  test_failures: 0
  lint_errors: 0
  typecheck_errors: 0
  context_warnings: 1
  safety_violations: []
  last_error: null
  recovery_attempts: 0
```

## Safety Check Procedures

### Pre-Cycle Safety Check
Execute before starting any new automation cycle:

1. **Environment Validation**
   ```
   ✅ Core config exists and valid
   ✅ Required directories accessible
   ✅ Epic files available
   ✅ Previous story completed or none exists
   ✅ Git repository clean state
   ```

2. **Limit Validation**
   ```
   ✅ Cycle count: 2/10 (within limits)
   ✅ Context length: 35000/50000 (within limits)
   ✅ Session time: 45min/120min (within limits)
   ✅ No safety violations pending
   ```

3. **Dependency Validation**
   ```
   ✅ All required files accessible
   ✅ Test commands configured
   ✅ Git repository accessible
   ✅ Architecture documents available
   ```

### Mid-Cycle Safety Monitoring
Execute during each phase transition:

1. **Progress Validation**
   - Verify phase completion requirements met
   - Check for unexpected errors or warnings
   - Validate user approvals obtained where required
   - Confirm automation state consistency

2. **Resource Monitoring**
   - Track context length growth
   - Monitor test execution time
   - Check file system accessibility
   - Validate git repository state

3. **Error Detection**
   - Scan for test failures or lint errors
   - Detect infinite loops or stuck states
   - Monitor for missing dependencies
   - Check for user intervention requirements

### Post-Cycle Safety Validation
Execute after story completion:

1. **Completion Validation**
   ```
   ✅ Story marked as "Done"
   ✅ All tasks completed successfully
   ✅ Tests passing
   ✅ Git commit successful
   ✅ No safety violations
   ```

2. **State Cleanup**
   - Reset phase-specific tracking
   - Archive completed story data
   - Update cycle counters
   - Prepare for next cycle

## Emergency Procedures

### Emergency Halt Triggers
1. **Context Critical**: >60k characters
2. **Test Cascade Failure**: >5 consecutive test failures
3. **Infinite Loop Detection**: Same task attempted >3 times
4. **Dependency Corruption**: Core files become inaccessible
5. **User Override**: Manual emergency halt command

### Emergency Halt Procedure
```
🚨 EMERGENCY HALT ACTIVATED 🚨

Reason: {halt_reason}
Timestamp: {halt_timestamp}
Current State: {current_state}

IMMEDIATE ACTIONS:
1. Stop all automation processes
2. Save current state to emergency backup
3. Generate safety violation report
4. Await user intervention

RECOVERY OPTIONS:
- *safety-check: Validate current state
- *emergency-reset: Reset to safe state
- *manual-recovery: Begin manual recovery
- *abort-session: Terminate automation session
```

### Recovery Procedures

#### Soft Recovery (Minor Issues)
1. Identify and report issue
2. Suggest corrective actions
3. Allow user to fix manually
4. Resume automation after validation

#### Hard Recovery (Major Issues)
1. Emergency halt all processes
2. Save state to backup
3. Generate comprehensive issue report
4. Require user review and explicit approval to continue

#### Session Reset (Critical Issues)
1. Terminate current automation session
2. Archive all session data
3. Reset all safety counters
4. Require fresh session initialization

## Safety Reporting

### Real-Time Safety Dashboard
```
BMad Development Orchestrator - Safety Status
============================================
Session: Active (1h 23m) | Cycle: 3/10 | Context: 42k/50k

Current Phase: Development
Story: 2.3.story.md (Ready for Review)
Next Gate: QA Review Decision

Safety Metrics:
✅ Cycle Limits: OK (3/10)
⚠️  Context: Warning (42k/50k) - Consider compacting
✅ Test Status: All passing
✅ Dependencies: All accessible
✅ Git State: Clean

Recent Activity:
- Story 2.3 tasks completed
- All validations passed
- File list updated
- Awaiting user decision on QA review
```

### Safety Violation Report
```
SAFETY VIOLATION DETECTED
========================
Violation: Context Warning Threshold Exceeded
Threshold: 40,000 characters
Current: 42,157 characters
Severity: Warning
Timestamp: 2024-01-01T11:23:45Z

Recommended Actions:
1. Execute *compact to reduce context
2. Continue monitoring during next phase
3. Consider compacting before next cycle

Automation Status: Continuing with monitoring
Next Safety Check: Phase transition
```

### Session Summary Report
```
BMad Automation Session Summary
==============================
Session Duration: 2h 15m
Cycles Completed: 4
Stories Completed: 4 (2.1, 2.2, 2.3, 2.4)
Total Commits: 4

Safety Performance:
- Safety Violations: 2 (warnings only)
- Emergency Halts: 0
- User Interventions: 8 (expected at gates)
- Test Failures: 0
- Context Managements: 1 (automatic)

Efficiency Metrics:
- Average Cycle Time: 33 minutes
- Test Pass Rate: 100%
- User Approval Time: 8 minutes average
- Context Growth Rate: 12k chars/cycle

Recommendations:
- Consider increasing max_cycles for longer sessions
- Context management working well
- No safety concerns identified
```