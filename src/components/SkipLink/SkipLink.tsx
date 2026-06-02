import styles from "./SkipLink.module.scss";

type SkipLinkProps = {
  targetId: string;
  children: React.ReactNode;
};

export function SkipLink({ targetId, children }: SkipLinkProps) {
  return (
    <a className={styles.skipLink} href={`#${targetId}`}>
      {children}
    </a>
  );
}
