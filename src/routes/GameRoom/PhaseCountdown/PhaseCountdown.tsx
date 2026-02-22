import { memo } from "react";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { usePhaseClock } from "@/lib/hooks/usePhaseClock";
import type * as Contracts from "@twf/contracts";

type RoomPublicState = Contracts.RoomPublicState;

export const PhaseCountdown = memo(function PhaseCountdown({
  state,
  secondsLeft,
  className,
}: {
  state?: RoomPublicState | null;
  secondsLeft?: number | null;
  className?: string;
}) {
  const clock = usePhaseClock(state ?? null);
  const displaySeconds = secondsLeft ?? clock.secondsLeft;
  return (
    <MainTextTypography variant="h2" className={className}>
      {displaySeconds ?? "--"}
    </MainTextTypography>
  );
});
