import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import { LoadableImage } from "@/components/LoadableImage/LoadableImage";

type CurrentItem = {
  name: string;
  imageSrc?: string | null;
};

type CurrentItemDisplayProps = {
  item: CurrentItem | null;
  isVisible: boolean;
  rowClassName?: string;
  imageClassName?: string;
  fallbackClassName?: string;
  nameClassName?: string;
  textAlign?: "left" | "center" | "right";
  emptyText?: string;
  hiddenText?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
};

export function CurrentItemDisplay({
  item,
  isVisible,
  rowClassName,
  imageClassName,
  fallbackClassName,
  nameClassName,
  textAlign = "center",
  emptyText = "--",
  hiddenText = "???",
  loading = "lazy",
  fetchPriority,
}: CurrentItemDisplayProps) {
  if (!isVisible) {
    return (
      <MainTextTypography textAlign={textAlign} variant="h4" muted>
        {hiddenText}
      </MainTextTypography>
    );
  }

  if (!item) {
    return (
      <MainTextTypography textAlign={textAlign} variant="body" muted>
        {emptyText}
      </MainTextTypography>
    );
  }

  return (
    <div className={rowClassName}>
      <LoadableImage
        className={imageClassName}
        src={item.imageSrc}
        alt={item.name}
        loading={loading}
        fetchPriority={fetchPriority}
        draggable={false}
        fallback={
          <div className={fallbackClassName} aria-hidden="true">
            <MainTextTypography textAlign={textAlign} variant="h4">
              {item.name}
            </MainTextTypography>
          </div>
        }
      />
      <MainTextTypography
        textAlign={textAlign}
        variant="h4"
        className={nameClassName}
      >
        {item.name}
      </MainTextTypography>
    </div>
  );
}
