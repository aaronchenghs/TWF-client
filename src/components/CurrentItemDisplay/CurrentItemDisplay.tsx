import clsx from "clsx";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { LoadableImage } from "@/components/LoadableImage/LoadableImage";
import styles from "./CurrentItemDisplay.module.scss";

type CurrentItem = {
  name: string;
  imageSrc?: string | null;
};

type CurrentItemDisplayProps = {
  item: CurrentItem | null;
  isVisible: boolean;
  containerClassName?: string;
  textAlign?: "left" | "center" | "right";
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
  if (!isVisible) {
    const isSimpleHiddenText =
      typeof hiddenText === "string" || typeof hiddenText === "number";

    if (!isSimpleHiddenText) return hiddenText;

    return (
      <MainTextTypography textAlign={textAlign} variant="h2" muted>
        {hiddenText}
      </MainTextTypography>
    );
  }

  if (!item) {
    return (
      <MainTextTypography textAlign={textAlign} variant="h2" muted>
        {emptyText}
      </MainTextTypography>
    );
  }

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
        textAlign={textAlign}
        variant="h2"
        className={styles.name}
      >
        {item.name}
      </MainTextTypography>
    </div>
  );
}
