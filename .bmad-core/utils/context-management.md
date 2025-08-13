# Context Management Utility

## Purpose

Prevent context bloating during automated development cycles by intelligently compacting conversations while preserving essential information.

## Context Thresholds

- **Warning Threshold**: 40,000 characters (suggest compacting)
- **Force Threshold**: 50,000 characters (mandatory compacting)
- **Critical Threshold**: 60,000 characters (emergency halt)

## Essential Context Preservation

### Always Preserve
1. **Current Story File**: Complete active story with all sections
2. **Core Configuration**: Contents of `.bmad-core/core-config.yaml`
3. **Safety State**: Current cycle count, safety violations, automation status
4. **Progress Summary**: Current phase, completed stories, next actions
5. **Active Tasks**: Any in-progress tasks and their status
6. **Error State**: Any current errors or blocking issues

### Archive and Summarize
1. **Previous Stories**: Keep only completion status and key insights
2. **Agent Conversations**: Summarize key decisions and outcomes
3. **Test Results**: Keep only current failures, archive previous successes
4. **File Change History**: Summarize changes, keep only current File List
5. **Debug Logs**: Keep references only, archive detailed logs

## Compacting Procedure

### 1. Pre-Compact Analysis
```
Current Context Analysis:
- Total Characters: {count}
- Essential Context: {essential_count} characters
- Archivable Content: {archivable_count} characters
- Compression Ratio: {ratio}%
```

### 2. Content Categorization
- **Critical**: Current story, safety state, active tasks
- **Important**: Progress summary, current errors, key decisions
- **Archivable**: Previous conversations, completed story details
- **Disposable**: Verbose logs, redundant information

### 3. Compact Execution
```
Context Compacting Initiated:

PRESERVED CONTEXT:
===================
Current Story: docs/stories/{current_story}
Status: {story_status}
Phase: {current_phase}
Cycle: {cycle_count}/{max_cycles}

Progress Summary:
- Completed Stories: {completed_list}
- Current Tasks: {active_tasks}
- Next Actions: {next_actions}

Safety State:
- Automation Active: {automation_status}
- Safety Violations: {violations}
- Context Length: {current_length}

ARCHIVED CONTEXT:
=================
- Previous Stories: {story_count} completed
- Agent Interactions: Summarized key decisions
- Test History: Current failures only
- File Changes: Current File List preserved

COMPACTING COMPLETE
New Context Length: {new_length} characters
Compression Achieved: {compression_percentage}%
```

### 4. Post-Compact Validation
- Verify all essential context preserved
- Confirm automation state maintained
- Validate story file accessibility
- Test agent memory continuity

## Automated Triggering

### Warning Level (40k chars)
```
⚠️ CONTEXT WARNING: Approaching context limit (40k/50k characters)
Suggest running: *compact
Continue for now, but compacting recommended soon.
```

### Force Level (50k chars)
```
🛑 CONTEXT CRITICAL: Force compacting required (50k+ characters)
Executing mandatory context compacting...
[Compacting procedure runs automatically]
Automation resuming with compacted context...
```

### Emergency Level (60k chars)
```
🚨 CONTEXT EMERGENCY: Critical threshold exceeded (60k+ characters)
HALTING ALL AUTOMATION IMMEDIATELY
Manual intervention required.
Run: *emergency-halt
Then: *compact
```

## Manual Compacting Commands

### Standard Compact
```
*compact
- Analyzes current context
- Preserves essential information
- Archives non-critical content
- Reports compression results
```

### Emergency Compact
```
*emergency-compact
- Aggressive compacting
- Minimal context preservation
- Emergency state protection
- Immediate execution
```

### Smart Compact
```
*smart-compact
- AI-driven content analysis
- Intelligent preservation decisions
- Optimal compression ratio
- Context quality maintenance
```

## Context Quality Metrics

### Preservation Quality
- **Essential Context**: 100% preserved
- **Important Context**: 90%+ preserved
- **Useful Context**: 50%+ preserved
- **Archive Context**: 10%+ preserved

### Compression Effectiveness
- **Target Ratio**: 60-80% compression
- **Minimum Viable**: 40% compression
- **Emergency Threshold**: 20% compression

### Memory Continuity
- **Agent State**: Fully maintained
- **Task Progress**: 100% preserved
- **Safety Mechanisms**: Fully operational
- **User Preferences**: Maintained

## Integration with Automation

### Proactive Monitoring
- Measure context after each major operation
- Predict context growth based on current phase
- Schedule compacting during natural breakpoints
- Avoid compacting during critical operations

### Safe Compacting Points
1. **Between Stories**: After story completion, before next story
2. **Phase Transitions**: Between SM → Dev → QA → Commit phases
3. **User Approval Gates**: During user decision points
4. **Error Recovery**: After resolving issues
5. **Session Breaks**: User-initiated pauses

### Unsafe Compacting Points
1. **Mid-Task Implementation**: During active development
2. **Test Execution**: While running validations
3. **Git Operations**: During commit processes
4. **Error States**: While resolving critical issues
5. **User Interactions**: During approval processes

## Recovery from Compacting Issues

### Context Loss Recovery
1. Restore from last known good state
2. Reload essential files from filesystem
3. Reconstruct safety state from git history
4. Resume from last confirmed checkpoint

### Automation State Recovery
1. Verify current story status
2. Rebuild task progress from story file
3. Restore safety counters from session data
4. Confirm all dependencies accessible

### User Communication
- Always notify user when compacting occurs
- Report what was preserved vs archived
- Confirm automation can continue safely
- Provide option to review compacted content