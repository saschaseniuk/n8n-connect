'use client';

import React, { type ReactNode } from 'react';
import type { WorkflowStatus as WorkflowStatusType, N8nError } from '@n8n-connect/core';

/**
 * Props for the WorkflowStatus component.
 */
export interface WorkflowStatusProps {
  /**
   * Current workflow status
   */
  status: WorkflowStatusType;
  /**
   * Progress value (0-1) for running state
   */
  progress?: number;
  /**
   * Error object for error state
   */
  error?: N8nError | null;
  /**
   * Additional CSS classes
   */
  className?: string;
  /**
   * Show step indicators
   * @default true
   */
  showSteps?: boolean;
  /**
   * Custom step labels
   * @default ['Triggered', 'Processing', 'Complete']
   */
  steps?: [string, string, string];
  /**
   * Display variant
   * @default 'default'
   */
  variant?: 'default' | 'minimal' | 'detailed';
  /**
   * Custom content for each state
   */
  children?: {
    idle?: ReactNode;
    running?: ReactNode;
    success?: ReactNode;
    error?: ReactNode;
  };
}

const DEFAULT_STEPS: [string, string, string] = ['Triggered', 'Processing', 'Complete'];

/**
 * Component for displaying workflow execution status.
 *
 * Provides visual feedback for workflow states with full accessibility support.
 * Supports customization through variants, custom content, and CSS classes.
 *
 * @example
 * ```tsx
 * // Basic usage with useWorkflow
 * function MyForm() {
 *   const { status, progress, error } = useWorkflow('/my-webhook');
 *   return <WorkflowStatus status={status} progress={progress} error={error} />;
 * }
 * ```
 *
 * @example
 * ```tsx
 * // With custom content
 * <WorkflowStatus
 *   status={status}
 *   progress={progress}
 *   error={error}
 * >
 *   {{
 *     idle: <span>Ready to submit</span>,
 *     running: <span>Processing your request...</span>,
 *     success: <span>Done!</span>,
 *     error: <span>Something went wrong</span>,
 *   }}
 * </WorkflowStatus>
 * ```
 */
export function WorkflowStatus({
  status,
  progress = 0,
  error,
  className = '',
  showSteps = true,
  steps = DEFAULT_STEPS,
  variant = 'default',
  children,
}: WorkflowStatusProps): JSX.Element | null {
  // Don't render anything for idle state unless custom content provided
  if (status === 'idle' && !children?.idle) {
    return null;
  }

  const baseClass = 'n8n-workflow-status';
  const variantClass = `${baseClass}--${variant}`;
  const statusClass = `${baseClass}--${status}`;

  return (
    <div
      className={`${baseClass} ${variantClass} ${statusClass} ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-busy={status === 'running'}
    >
      {/* Custom content override */}
      {children?.[status] ? (
        children[status]
      ) : (
        <>
          {/* Status indicator */}
          <div className={`${baseClass}__indicator`}>
            {status === 'running' && <LoadingSpinner />}
            {status === 'success' && <SuccessIcon />}
            {status === 'error' && <ErrorIcon />}
          </div>

          {/* Status message */}
          <div className={`${baseClass}__content`}>
            {status === 'idle' && (
              <span className={`${baseClass}__message`}>Ready</span>
            )}

            {status === 'running' && (
              <>
                <span className={`${baseClass}__message`}>Processing...</span>
                {variant !== 'minimal' && progress > 0 && (
                  <ProgressBar progress={progress} />
                )}
              </>
            )}

            {status === 'success' && (
              <span className={`${baseClass}__message`}>Complete</span>
            )}

            {status === 'error' && (
              <>
                <span className={`${baseClass}__message`}>
                  {error?.message || 'An error occurred'}
                </span>
                {variant === 'detailed' && error?.code && (
                  <span className={`${baseClass}__error-code`}>
                    Error code: {error.code}
                  </span>
                )}
              </>
            )}
          </div>

          {/* Step indicators */}
          {showSteps && variant !== 'minimal' && (
            <StepIndicator status={status} steps={steps} />
          )}
        </>
      )}
    </div>
  );
}

// Sub-components

function LoadingSpinner(): JSX.Element {
  return (
    <svg
      className="n8n-workflow-status__spinner"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" opacity="0.25" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round">
        <animateTransform
          attributeName="transform"
          type="rotate"
          from="0 12 12"
          to="360 12 12"
          dur="1s"
          repeatCount="indefinite"
        />
      </path>
    </svg>
  );
}

function SuccessIcon(): JSX.Element {
  return (
    <svg
      className="n8n-workflow-status__icon n8n-workflow-status__icon--success"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ErrorIcon(): JSX.Element {
  return (
    <svg
      className="n8n-workflow-status__icon n8n-workflow-status__icon--error"
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" strokeLinecap="round" />
      <circle cx="12" cy="16" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

interface ProgressBarProps {
  progress: number;
}

function ProgressBar({ progress }: ProgressBarProps): JSX.Element {
  // Progress is already 0-100, just round it
  const percentage = Math.round(progress);

  return (
    <div
      className="n8n-workflow-status__progress"
      role="progressbar"
      aria-valuenow={percentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${percentage}% complete`}
    >
      <div
        className="n8n-workflow-status__progress-bar"
        style={{ width: `${percentage}%` }}
      />
      <span className="n8n-workflow-status__progress-text">{percentage}%</span>
    </div>
  );
}

interface StepIndicatorProps {
  status: WorkflowStatusType;
  steps: [string, string, string];
}

function StepIndicator({ status, steps }: StepIndicatorProps): JSX.Element {
  const currentStep =
    status === 'idle'
      ? -1
      : status === 'running'
        ? 1
        : status === 'success'
          ? 2
          : status === 'error'
            ? 1
            : -1;

  return (
    <ol className="n8n-workflow-status__steps" aria-label="Workflow progress">
      {steps.map((step, index) => {
        const isComplete = index < currentStep;
        const isCurrent = index === currentStep;
        const stepClass = isComplete ? 'complete' : isCurrent ? 'current' : 'pending';

        return (
          <li
            key={step}
            className={`n8n-workflow-status__step n8n-workflow-status__step--${stepClass}`}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="n8n-workflow-status__step-indicator">
              {isComplete ? '✓' : index + 1}
            </span>
            <span className="n8n-workflow-status__step-label">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}
