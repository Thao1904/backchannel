import { getDeviceDefinition } from "@/lib/survey-prototype/backchannel-data";
import { DeviceIllustration } from "@/components/survey/device-illustration";
import { OnboardingState } from "@/lib/survey-prototype/types";
import { StepHeader } from "@/components/survey/step-header";

type SummaryScreenProps = {
  state: OnboardingState;
  onRestart: () => void;
  onContinue?: () => void;
};

export function SummaryScreen({
  state,
  onRestart,
  onContinue,
}: SummaryScreenProps) {
  const addressee = state.userName.trim() || "you";
  const addressedName = <span className="font-bold text-[var(--accent-strong)]">{addressee}</span>;

  return (
    <div className="flex min-h-0 flex-1 flex-col pt-10">
      <StepHeader
        eyebrow="Complete"
        title="The arrangement is recorded."
        description={
          <>
            A quiet summary of the devices {addressedName} kept close, the ones {addressedName} would replace, and the ones that seem difficult to release.
          </>
        }
      />

      <div className="soft-scrollbar mt-10 min-h-0 flex-1 overflow-y-auto pr-1 pb-2">
        <div className="grid gap-4 sm:grid-cols-2">
          {state.selectedDevices.map((device) => {
            const definition = getDeviceDefinition(device);
            const response = state.deviceResponses[device];
            return (
              <section
                key={device}
                className="rounded-[28px] border border-black/12 bg-white/55 p-5"
              >
                <div className="flex items-center gap-4">
                  <div className="text-black/78">
                    <DeviceIllustration device={device} size="medium" />
                  </div>
                  <div>
                    <h2 className="text-base text-black">{definition.label}</h2>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.16em] text-black/40">
                      observation
                    </p>
                  </div>
                </div>
                <dl className="mt-5 space-y-2 text-sm text-black/65">
                  <div className="flex justify-between gap-4">
                    <dt>Like</dt>
                    <dd>{response.like ?? "-"}/5</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Frequency</dt>
                    <dd>{response.frequency ?? "-"}</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Helpfulness</dt>
                    <dd>{response.helpPercent ?? 0}%</dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt>Ease of use</dt>
                    <dd>{response.easeOfUse ?? "-"}/5</dd>
                  </div>
                </dl>
              </section>
            );
          })}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-[28px] border border-black/12 bg-white/50 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-black/40">
              Favorite
            </p>
            <p className="mt-3 text-sm text-black">
              {state.favorite ? getDeviceDefinition(state.favorite).label : "-"}
            </p>
          </div>
          <div className="rounded-[28px] border border-black/12 bg-white/50 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-black/40">
              Never replace
            </p>
            <p className="mt-3 text-sm text-black">
              {state.neverReplace.length
                ? state.neverReplace.map((device) => getDeviceDefinition(device).label).join(", ")
                : "-"}
            </p>
          </div>
          <div className="rounded-[28px] border border-black/12 bg-white/50 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-black/40">
              Most replaceable to least
            </p>
            <p className="mt-3 text-sm text-black">
              {state.replaceRanking.map((device) => getDeviceDefinition(device).shortLabel).join(" / ")}
            </p>
          </div>
          <div className="rounded-[28px] border border-black/12 bg-white/50 p-5">
            <p className="text-[11px] uppercase tracking-[0.16em] text-black/40">
              Most essential to least
            </p>
            <p className="mt-3 text-sm text-black">
              {state.essentialRanking.map((device) => getDeviceDefinition(device).shortLabel).join(" / ")}
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {onContinue ? (
            <button
              type="button"
              onClick={onContinue}
              className="rounded-full border-[3px] border-black/85 bg-[var(--accent)] px-5 py-2 text-sm font-semibold text-black transition hover:-translate-y-0.5 hover:bg-[#ffe2f3]"
            >
              Enter Backchannel
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRestart}
            className="rounded-full border border-black/15 bg-white/65 px-5 py-2 text-sm text-black transition hover:border-black/30 hover:bg-white"
          >
            Begin again
          </button>
        </div>
      </div>
    </div>
  );
}
