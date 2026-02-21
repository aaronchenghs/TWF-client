import type { CSSProperties } from "react";
import clsx from "clsx";
import type { Avatar } from "@twf/contracts";
import styles from "./PlayerAvatar.module.scss";
import { resolvePlayerAvatarLayers } from "@/lib/playerAvatar";

type PlayerAvatarProps = {
  avatar: Avatar | string | null | undefined;
  className?: string;
  size?: number;
  sway?: boolean;
};

export function PlayerAvatar({
  avatar,
  className,
  size = 36,
  sway = false,
}: PlayerAvatarProps) {
  const layers = resolvePlayerAvatarLayers(avatar);

  const rootStyle = {
    "--avatar-size": `${size}px`,
  } as CSSProperties;

  if (!layers) {
    return (
      <div
        className={clsx(
          styles.root,
          styles.fallback,
          sway && styles.sway,
          className,
        )}
        style={rootStyle}
        aria-hidden="true"
      />
    );
  }

  return (
    <div
      className={clsx(styles.root, sway && styles.sway, className)}
      style={rootStyle}
      aria-hidden="true"
    >
      <img
        className={styles.layer}
        src={layers.bodySrc}
        alt=""
        decoding="async"
      />
      <img
        className={styles.layer}
        src={layers.mouthSrc}
        alt=""
        decoding="async"
      />
      <img
        className={styles.layer}
        src={layers.eyesSrc}
        alt=""
        decoding="async"
      />
    </div>
  );
}
