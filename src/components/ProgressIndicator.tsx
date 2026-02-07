import { Progress } from '@/components/ui/progress';
import { GenerationProgress } from '@/lib/api';
import { CheckCircle2, Circle, Loader2 } from 'lucide-react';

interface ProgressIndicatorProps {
  progress: GenerationProgress | null;
  isGenerating: boolean;
}

const STEPS = [
  { key: 'analyzing', label: 'Analyzing description' },
  { key: 'bio', label: 'Generating biography' },
  { key: 'image', label: 'Creating portrait' },
  { key: 'voice', label: 'Synthesizing voice' },
  { key: 'finalizing', label: 'Finalizing' },
];

export function ProgressIndicator({ progress, isGenerating }: ProgressIndicatorProps) {
  if (!isGenerating && !progress) return null;

  const currentStepIndex = progress 
    ? STEPS.findIndex(s => s.key === progress.step) 
    : 0;

  return (
    <div className="space-y-4 p-4 bg-muted/20 rounded-lg border border-border/30">
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="text-muted-foreground font-medium uppercase tracking-wider">
            Progress
          </span>
          <span className="text-primary font-mono">
            {progress?.progress ?? 0}%
          </span>
        </div>
        <Progress 
          value={progress?.progress ?? 0} 
          className="h-2 bg-muted/50"
        />
      </div>

      {/* Current status message */}
      {progress?.message && (
        <p className="text-sm text-foreground/80 animate-fade-in">
          {progress.message}
        </p>
      )}

      {/* Step indicators */}
      <div className="space-y-2">
        {STEPS.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex && isGenerating;
          const isPending = index > currentStepIndex;

          return (
            <div 
              key={step.key}
              className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                isCompleted 
                  ? 'text-success' 
                  : isCurrent 
                    ? 'text-primary' 
                    : 'text-muted-foreground/50'
              }`}
            >
              {isCompleted ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : isCurrent ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Circle className="h-4 w-4" />
              )}
              <span className={isCurrent ? 'font-medium' : ''}>
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
