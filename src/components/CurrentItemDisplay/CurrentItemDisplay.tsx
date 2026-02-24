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
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

export function CurrentItemDisplay({
  item,
  isVisible,
  containerClassName,
  textAlign = "center",
  emptyText = "--",
  hiddenText = "???",
  loading = "lazy",
  fetchPriority,
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
        loading={loading}
        fetchPriority={fetchPriority}
        draggable={false}
        fallback={
          <div className={styles.imageFallback} aria-hidden="true">
            <MainTextTypography textAlign={textAlign} variant="h2">
              {item.name}
            </MainTextTypography>
          </div>
        }
      />
      <MainTextTypography textAlign={textAlign} variant="h2" className={styles.name}>
        {item.name}
      </MainTextTypography>
    </div>
  );
}
