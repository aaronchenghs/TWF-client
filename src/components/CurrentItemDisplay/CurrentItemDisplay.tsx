import { useRef } from "react";
import clsx from "clsx";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { LoadableImage } from "@/components/LoadableImage/LoadableImage";
import { useAutoFitText } from "@/lib/hooks/useAutoFitText";
import styles from "./CurrentItemDisplay.module.scss";

type CurrentItem = {
  name: string;
  imageSrc?: string | null;
};

type CurrentItemDisplayTextAlign = "left" | "center" | "right";

type CurrentItemDisplayProps = {
  item: CurrentItem | null;
  isVisible: boolean;
  containerClassName?: string;
  textAlign?: CurrentItemDisplayTextAlign;
  emptyText?: string;
  hiddenText?: React.ReactNode;
};

export function CurrentItemDisplay({
  item,
  isVisible,
  containerClassName,
  textAlign = "center",
  emptyText = "--",
  hiddenText = "???",
}: CurrentItemDisplayProps) {
  const itemNameRef = useRef<HTMLSpanElement | null>(null);

  useAutoFitText(itemNameRef, {
    minFontSizePx: 14,
    enabled: !!item && isVisible,
    watch: item?.name,
  });

  if (!isVisible) {
    const isSimpleHiddenText =
      typeof hiddenText === "string" || typeof hiddenText === "number";
    if (!isSimpleHiddenText) return hiddenText;

    return (
      <CurrentItemPlaceholder
        text={hiddenText}
        textAlign={textAlign}
        containerClassName={containerClassName}
      />
    );
  }

  if (!item)
    return (
      <CurrentItemPlaceholder
        text={emptyText}
        textAlign={textAlign}
        containerClassName={containerClassName}
      />
    );

  return (
    <div className={clsx(styles.container, containerClassName)}>
      <LoadableImage
        className={styles.image}
        src={item.imageSrc}
        alt={item.name}
        loading={"lazy"}
        fetchPriority={"high"}
        draggable={false}
      />
      <MainTextTypography
        ref={itemNameRef}
        textAlign={textAlign}
        variant="h2"
        className={styles.name}
      >
        {item.name}
      </MainTextTypography>
    </div>
  );
}

type CurrentItemPlaceholderProps = {
  text: string | number;
  textAlign: CurrentItemDisplayTextAlign;
  containerClassName?: string;
};

function CurrentItemPlaceholder({
  text,
  textAlign,
  containerClassName,
}: CurrentItemPlaceholderProps) {
  return (
    <div className={clsx(styles.placeholderContainer, containerClassName)}>
      <MainTextTypography
        textAlign={textAlign}
        variant="h2"
        muted
        className={styles.placeholderText}
      >
        {text}
      </MainTextTypography>
    </div>
  );
}
