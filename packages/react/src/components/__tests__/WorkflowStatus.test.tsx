import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { WorkflowStatus } from '../WorkflowStatus';
import { N8nError } from '@n8n-connect/core';

// Helper for error creation
const createError = (message: string, code: string) =>
  new N8nError(message, { code: code as any });

describe('WorkflowStatus', () => {
  describe('Rendering', () => {
    it('should render nothing for idle without custom content', () => {
      const { container } = render(<WorkflowStatus status="idle" />);

      expect(container.firstChild).toBeNull();
    });

    it('should render for idle with custom content', () => {
      render(
        <WorkflowStatus status="idle">
          {{ idle: <span>Ready to start</span> }}
        </WorkflowStatus>
      );

      expect(screen.getByText('Ready to start')).toBeInTheDocument();
    });

    it('should render for running', () => {
      render(<WorkflowStatus status="running" showSteps={false} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
    });

    it('should render for success', () => {
      render(<WorkflowStatus status="success" showSteps={false} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
    });

    it('should render for error', () => {
      const error = createError('Something went wrong', 'WORKFLOW_ERROR');
      render(<WorkflowStatus status="error" error={error} showSteps={false} />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });
  });

  describe('Progress Bar', () => {
    it('should show progress bar when running with progress', () => {
      render(<WorkflowStatus status="running" progress={50} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toBeInTheDocument();
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
    });

    it('should show progress as percentage', () => {
      render(<WorkflowStatus status="running" progress={75} />);

      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    it('should not show progress bar when progress=0', () => {
      render(<WorkflowStatus status="running" progress={0} />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should not show progress bar for minimal variant', () => {
      render(<WorkflowStatus status="running" progress={50} variant="minimal" />);

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    it('should show 100% when progress=100', () => {
      render(<WorkflowStatus status="running" progress={100} />);

      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  describe('Error Display', () => {
    it('should show error message', () => {
      const error = createError('Network timeout', 'TIMEOUT');
      render(<WorkflowStatus status="error" error={error} />);

      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });

    it('should show default message when error is missing', () => {
      render(<WorkflowStatus status="error" />);

      expect(screen.getByText(/error occurred/i)).toBeInTheDocument();
    });

    it('should show error code for detailed variant', () => {
      const error = createError('Auth failed', 'AUTH_ERROR');
      render(<WorkflowStatus status="error" error={error} variant="detailed" />);

      expect(screen.getByText('Auth failed')).toBeInTheDocument();
      expect(screen.getByText(/AUTH_ERROR/)).toBeInTheDocument();
    });

    it('should not show error code for default variant', () => {
      const error = createError('Auth failed', 'AUTH_ERROR');
      render(<WorkflowStatus status="error" error={error} variant="default" />);

      expect(screen.getByText('Auth failed')).toBeInTheDocument();
      expect(screen.queryByText(/AUTH_ERROR/)).not.toBeInTheDocument();
    });
  });

  describe('Step Indicators', () => {
    it('should show step indicators when showSteps=true', () => {
      render(<WorkflowStatus status="running" showSteps />);

      expect(screen.getByRole('list', { name: /progress/i })).toBeInTheDocument();
    });

    it('should show default steps', () => {
      render(<WorkflowStatus status="running" showSteps />);

      expect(screen.getByText('Triggered')).toBeInTheDocument();
      expect(screen.getByText('Processing')).toBeInTheDocument();
      expect(screen.getByText('Complete')).toBeInTheDocument();
    });

    it('should show custom steps', () => {
      render(
        <WorkflowStatus
          status="running"
          showSteps
          steps={['Submitted', 'Analyzing', 'Done']}
        />
      );

      expect(screen.getByText('Submitted')).toBeInTheDocument();
      expect(screen.getByText('Analyzing')).toBeInTheDocument();
      expect(screen.getByText('Done')).toBeInTheDocument();
    });

    it('should mark correct step as current', () => {
      render(<WorkflowStatus status="running" showSteps />);

      const steps = screen.getAllByRole('listitem');
      // For running state, step 2 (Processing) should be current
      expect(steps[1]).toHaveAttribute('aria-current', 'step');
    });

    it('should not show steps for minimal variant', () => {
      render(<WorkflowStatus status="running" showSteps variant="minimal" />);

      expect(screen.queryByRole('list')).not.toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should render default variant correctly', () => {
      const { container } = render(
        <WorkflowStatus status="running" variant="default" />
      );

      expect(container.querySelector('.n8n-workflow-status--default')).toBeInTheDocument();
    });

    it('should render minimal variant correctly', () => {
      const { container } = render(
        <WorkflowStatus status="running" variant="minimal" />
      );

      expect(container.querySelector('.n8n-workflow-status--minimal')).toBeInTheDocument();
    });

    it('should render detailed variant correctly', () => {
      const { container } = render(
        <WorkflowStatus status="running" variant="detailed" />
      );

      expect(container.querySelector('.n8n-workflow-status--detailed')).toBeInTheDocument();
    });
  });

  describe('Custom Content', () => {
    it('should render custom idle content', () => {
      render(
        <WorkflowStatus status="idle">
          {{ idle: <span data-testid="custom-idle">Custom Idle</span> }}
        </WorkflowStatus>
      );

      expect(screen.getByTestId('custom-idle')).toBeInTheDocument();
    });

    it('should render custom running content', () => {
      render(
        <WorkflowStatus status="running">
          {{ running: <span data-testid="custom-running">Loading...</span> }}
        </WorkflowStatus>
      );

      expect(screen.getByTestId('custom-running')).toBeInTheDocument();
    });

    it('should render custom success content', () => {
      render(
        <WorkflowStatus status="success">
          {{ success: <span data-testid="custom-success">All done!</span> }}
        </WorkflowStatus>
      );

      expect(screen.getByTestId('custom-success')).toBeInTheDocument();
    });

    it('should render custom error content', () => {
      render(
        <WorkflowStatus status="error">
          {{ error: <span data-testid="custom-error">Oops!</span> }}
        </WorkflowStatus>
      );

      expect(screen.getByTestId('custom-error')).toBeInTheDocument();
    });

    it('should use standard content when no custom content for status', () => {
      render(
        <WorkflowStatus status="success" showSteps={false}>
          {{ running: <span>Custom running only</span> }}
        </WorkflowStatus>
      );

      // Should show standard success, not custom running
      expect(screen.getByText(/complete/i)).toBeInTheDocument();
    });
  });

  describe('CSS Classes', () => {
    it('should have base class', () => {
      const { container } = render(<WorkflowStatus status="running" />);

      expect(container.querySelector('.n8n-workflow-status')).toBeInTheDocument();
    });

    it('should have status-specific class', () => {
      const { container: runningContainer } = render(
        <WorkflowStatus status="running" />
      );
      const { container: successContainer } = render(
        <WorkflowStatus status="success" />
      );
      const { container: errorContainer } = render(
        <WorkflowStatus status="error" />
      );

      expect(runningContainer.querySelector('.n8n-workflow-status--running')).toBeInTheDocument();
      expect(successContainer.querySelector('.n8n-workflow-status--success')).toBeInTheDocument();
      expect(errorContainer.querySelector('.n8n-workflow-status--error')).toBeInTheDocument();
    });

    it('should apply className prop', () => {
      const { container } = render(
        <WorkflowStatus status="running" className="my-custom-class" />
      );

      expect(container.querySelector('.my-custom-class')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have role="status"', () => {
      render(<WorkflowStatus status="running" />);

      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should have aria-live="polite"', () => {
      render(<WorkflowStatus status="running" />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
    });

    it('should have aria-busy when running', () => {
      render(<WorkflowStatus status="running" />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true');
    });

    it('should have aria-busy=false when not running', () => {
      render(<WorkflowStatus status="success" />);

      expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'false');
    });

    it('should have progress bar aria attributes', () => {
      render(<WorkflowStatus status="running" progress={50} />);

      const progressBar = screen.getByRole('progressbar');
      expect(progressBar).toHaveAttribute('aria-valuenow', '50');
      expect(progressBar).toHaveAttribute('aria-valuemin', '0');
      expect(progressBar).toHaveAttribute('aria-valuemax', '100');
      expect(progressBar).toHaveAttribute('aria-label');
    });

    it('should have SVG icons with aria-hidden', () => {
      const { container } = render(<WorkflowStatus status="success" />);

      const svgs = container.querySelectorAll('svg');
      svgs.forEach((svg) => {
        expect(svg).toHaveAttribute('aria-hidden', 'true');
      });
    });

    it('should have step list aria-label', () => {
      render(<WorkflowStatus status="running" showSteps />);

      expect(screen.getByRole('list', { name: /progress/i })).toBeInTheDocument();
    });

    it('should mark current step with aria-current', () => {
      render(<WorkflowStatus status="running" showSteps />);

      const currentStep = screen.getByRole('listitem', { current: 'step' });
      expect(currentStep).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should show spinner when running', () => {
      const { container } = render(<WorkflowStatus status="running" />);

      expect(container.querySelector('.n8n-workflow-status__spinner')).toBeInTheDocument();
    });

    it('should show success icon when success', () => {
      const { container } = render(<WorkflowStatus status="success" />);

      expect(
        container.querySelector('.n8n-workflow-status__icon--success')
      ).toBeInTheDocument();
    });

    it('should show error icon when error', () => {
      const { container } = render(<WorkflowStatus status="error" />);

      expect(
        container.querySelector('.n8n-workflow-status__icon--error')
      ).toBeInTheDocument();
    });
  });

  describe('Client Component', () => {
    it('should have "use client" directive', async () => {
      const fs = await import('fs/promises');
      const path = await import('path');

      const componentPath = path.resolve(__dirname, '../WorkflowStatus.tsx');
      const content = await fs.readFile(componentPath, 'utf-8');

      expect(
        content.startsWith("'use client'") || content.startsWith('"use client"')
      ).toBe(true);
    });
  });
});
