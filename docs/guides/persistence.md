# State Persistence

Maintain workflow state across page reloads and browser sessions.

## Overview

When users refresh the page during a long-running workflow, you don't want them to lose progress. n8n-connect provides persistence options to:

- Resume polling after page reload
- Restore UI state
- Track workflow execution across sessions

## Persistence Modes

### Session Storage

Data persists until the browser tab is closed.

```typescript
const { execute, status, data } = useWorkflow('generate-report', {
  persist: 'session',
});
```

### Local Storage

Data persists across browser sessions.

```typescript
const { execute, status, data } = useWorkflow('batch-process', {
  persist: 'local',
});
```

### No Persistence (Default)

State is lost on page reload.

```typescript
const { execute } = useWorkflow('quick-action', {
  persist: false, // or omit entirely
});
```

## How It Works

### Starting an Execution

```
1. User clicks "Generate Report"
2. execute() is called
3. Initial request returns { executionId: "abc123" }
4. If persist='session', executionId is saved to sessionStorage
5. Polling begins
```

### On Page Reload

```
1. User refreshes page
2. useWorkflow hook initializes
3. Checks sessionStorage for saved executionId
4. If found and status was 'running':
   - Resumes polling with saved executionId
   - UI shows "running" state
5. When workflow completes, state updates normally
```

## Basic Usage

```tsx
function ReportGenerator() {
  const { execute, status, data, progress, error } = useWorkflow(
    'generate-annual-report',
    {
      persist: 'session',
      polling: {
        enabled: true,
        interval: 3000,
        timeout: 300000, // 5 minutes
      },
    }
  );

  return (
    <div>
      <button
        onClick={() => execute({ data: { year: 2024 } })}
        disabled={status === 'running'}
      >
        {status === 'running' ? 'Generating...' : 'Generate Report'}
      </button>

      {status === 'running' && (
        <div>
          <p>Processing... (safe to refresh this page)</p>
          {progress !== null && <progress value={progress} max={100} />}
        </div>
      )}

      {data?.reportUrl && (
        <a href={data.reportUrl} download>
          Download Report
        </a>
      )}

      {error && <p className="error">{error.message}</p>}
    </div>
  );
}
```

## What Gets Persisted

The following state is saved:

```typescript
interface PersistedState {
  // Execution tracking
  executionId: string | null;
  status: WorkflowStatus;

  // Timestamps
  startedAt: number | null;
  lastPolledAt: number | null;

  // Result data (if completed before reload)
  data: unknown | null;
  error: SerializedError | null;
}
```

## Storage Keys

Data is stored with keys based on the webhook path:

```
n8n-connect:generate-report  // sessionStorage or localStorage
```

## Advanced Patterns

### Cross-Tab Awareness

With `persist: 'local'`, state can be shared across tabs:

```tsx
function CrossTabWorkflow() {
  const { status, data } = useWorkflow('shared-process', {
    persist: 'local',
  });

  // All tabs with this component will show the same status
  // When one tab completes, all tabs update
}
```

### Conditional Persistence

```tsx
function SmartWorkflow() {
  const isLongRunning = estimatedDuration > 30000;

  const { execute } = useWorkflow('variable-workflow', {
    persist: isLongRunning ? 'session' : false,
    polling: {
      enabled: isLongRunning,
    },
  });
}
```

### Custom Persistence Key

For multiple instances of the same workflow:

```tsx
function MultiInstanceWorkflow({ instanceId }: { instanceId: string }) {
  const { execute } = useWorkflow(`process-${instanceId}`, {
    persist: 'session',
  });
}
```

### Clearing Persisted State

The `reset()` function clears persisted state:

```tsx
function WorkflowWithReset() {
  const { execute, status, reset } = useWorkflow('my-workflow', {
    persist: 'session',
  });

  return (
    <div>
      <button onClick={() => execute()}>Start</button>

      {status !== 'idle' && (
        <button onClick={reset}>
          Clear & Start Over
        </button>
      )}
    </div>
  );
}
```

## Default Persistence

Set default persistence in the provider:

```tsx
<N8nProvider
  config={{
    baseUrl: 'https://n8n.example.com',
    defaultPersist: 'session',
  }}
>
  {children}
</N8nProvider>
```

Individual hooks can override:

```typescript
// Uses provider default ('session')
const workflow1 = useWorkflow('workflow-1');

// Overrides to local storage
const workflow2 = useWorkflow('workflow-2', { persist: 'local' });

// Disables persistence
const workflow3 = useWorkflow('workflow-3', { persist: false });
```

## Expiration

Persisted state includes timestamps and can be considered stale:

```typescript
const { execute } = useWorkflow('my-workflow', {
  persist: 'session',
  // State older than this is discarded on reload
  persistExpiration: 3600000, // 1 hour
});
```

## User Experience Tips

### Show Persistence Indicator

```tsx
function PersistentWorkflow() {
  const { status } = useWorkflow('long-task', {
    persist: 'session',
    polling: { enabled: true },
  });

  return (
    <div>
      {status === 'running' && (
        <div className="notice">
          <span className="icon">💾</span>
          <span>Progress is saved. You can safely refresh the page.</span>
        </div>
      )}
    </div>
  );
}
```

### Handle Stale State

```tsx
function WorkflowWithStaleCheck() {
  const { status, data, reset } = useWorkflow('my-workflow', {
    persist: 'local',
  });

  // Check if persisted data is too old
  const isStale = data && Date.now() - data.generatedAt > 86400000; // 1 day

  if (isStale) {
    return (
      <div>
        <p>Your previous result is outdated.</p>
        <button onClick={reset}>Generate New</button>
      </div>
    );
  }

  // ... normal rendering
}
```

### Inform About Resumed State

```tsx
function ResumedWorkflowNotice() {
  const { status } = useWorkflow('my-workflow', { persist: 'session' });
  const [wasResumed, setWasResumed] = useState(false);

  useEffect(() => {
    // Check if we resumed from persisted state
    const key = 'n8n-connect:my-workflow';
    if (sessionStorage.getItem(key) && status === 'running') {
      setWasResumed(true);
    }
  }, []);

  return (
    <div>
      {wasResumed && status === 'running' && (
        <div className="info">
          Resuming your previous workflow...
        </div>
      )}
    </div>
  );
}
```

## Related

- [useWorkflow Hook](../react/hooks/use-workflow.md)
- [Polling Options](../core/polling/polling-options.md)
- [Configuration](../getting-started/configuration.md)
