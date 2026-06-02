import clsx from "clsx";
import { MainTextTypography } from "@/components/MainTextTypography/MainTextTypography";
import styles from "./ModalHeaderTitle.module.scss";

type ModalHeaderTitleProps = {
  icon: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  iconClassName?: string;
  titleClassName?: string;
};

export function ModalHeaderTitle({
  icon,
  children,
  className,
  iconClassName,
  titleClassName,
}: ModalHeaderTitleProps) {
  return (
    <div className={clsx(styles.root, className)}>
      <span className={clsx(styles.icon, iconClassName)} role="presentation">
        {icon}
      </span>
      <MainTextTypography variant="h3" className={titleClassName}>
        {children}
      </MainTextTypography>
    </div>
  );
}
