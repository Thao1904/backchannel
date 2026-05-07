import { ReactNode } from "react";
import { ProgressIndicator } from "@/components/survey/progress-indicator";

type OnboardingShellProps = {
  children: ReactNode;
  currentStep: number;
  totalSteps: number;
  canGoBack?: boolean;
  onBack?: () => void;
  onNext?: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  footerSlot?: ReactNode;
  hideFooter?: boolean;
};

export function OnboardingShell({
  children,
  currentStep,
  totalSteps,
  canGoBack,
  onBack,
  onNext,
  nextLabel = "Next",
  nextDisabled,
  footerSlot,
  hideFooter,
}: OnboardingShellProps) {
  return (
    <main className="grain flex min-h-screen select-none items-center justify-center px-5 py-28 sm:px-8 sm:py-32">
      <div className="mobile-scale-shell flex w-full max-w-[1200px] flex-col items-center sm:w-full sm:max-w-[1200px] sm:scale-100">
        <div className="relative mx-auto flex h-[min(86vh,900px)] min-h-[760px] w-full max-w-[860px] flex-col rounded-[40px] border-[3px] border-black/80 bg-[var(--panel)] px-6 py-6 shadow-[var(--paper-shadow)] sm:px-10 sm:py-8">
          <ProgressIndicator current={currentStep} total={totalSteps} />
          <div className="soft-scrollbar min-h-0 flex-1 overflow-y-auto overflow-x-hidden pr-1">
            <div className="flex min-h-full flex-col">{children}</div>
          </div>
          {hideFooter ? null : (
            <footer className="mt-8 flex items-center justify-between gap-4 border-t-[3px] border-black/12 pt-5">
              <button
                type="button"
                onClick={onBack}
                disabled={!canGoBack}
                className="rounded-full border-[3px] border-black/85 bg-white px-5 py-2.5 text-sm font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffe2f3] disabled:cursor-not-allowed disabled:opacity-30"
              >
                Back
              </button>
              {footerSlot}
              {onNext ? (
                <button
                  type="button"
                  onClick={onNext}
                  disabled={nextDisabled}
                  className="rounded-full border-[3px] border-black/85 bg-[var(--accent)] px-6 py-2.5 text-sm font-semibold text-black transition duration-200 hover:-translate-y-0.5 hover:bg-[#ffe2f3] disabled:cursor-not-allowed disabled:opacity-35"
                >
                  {nextLabel}
                </button>
              ) : <div className="w-[72px]" />}
            </footer>
          )}
        </div>
      </div>
    </main>
  );
}
