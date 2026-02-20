import { memo } from "react";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { usePhaseClock } from "@/lib/hooks/usePhaseClock";
import type * as Contracts from "@twf/contracts";

type RoomPublicState = Contracts.RoomPublicState;

export const PhaseCountdown = memo(function PhaseCountdown({
  state,
  className,
}: {
  state: RoomPublicState;
  className?: string;
}) {
  const clock = usePhaseClock(state);
  return (
    <MainTextTypography variant="h2" className={className}>
      {clock.secondsLeft ?? "--"}
    </MainTextTypography>
  );
});
