import type { ComponentProps } from "react";
import clsx from "clsx";
import { CopyTextButton } from "@/components/CopyTextButton/CopyTextButton";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { useRoomCodeDisplayValue } from "@/lib/roomCode";
import styles from "./RoomCodeDisplay.module.scss";

type TypographyProps = ComponentProps<typeof MainTextTypography>;

type RoomCodeDisplayProps = {
  roomCode: string;
  title?: string;
  className?: string;
  codeClassName?: string;
  variant?: TypographyProps["variant"];
  muted?: TypographyProps["muted"];
};

export function RoomCodeDisplay({
  roomCode,
  title = "Copy room code",
  className,
  codeClassName,
  variant = "h4",
  muted,
}: RoomCodeDisplayProps) {
  const {
    roomCode: normalizedRoomCode,
    isRoomCodeValid,
    displayRoomCode,
  } = useRoomCodeDisplayValue(roomCode);

  return (
    <div className={clsx(styles.root, className)}>
      <CopyTextButton
        value={normalizedRoomCode}
        disabled={!isRoomCodeValid}
        title={title}
      />
      <MainTextTypography
        className={clsx(styles.code, codeClassName)}
        variant={variant}
        muted={muted}
        tone="player"
      >
        {displayRoomCode}
      </MainTextTypography>
    </div>
  );
}
