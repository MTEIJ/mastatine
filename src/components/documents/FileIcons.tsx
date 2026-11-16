interface IconProps {
  size?: number;
  className?: string;
}

function Svg({ size = 18, className, children }: IconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      {children}
    </svg>
  );
}

export const FolderIcon = (p: IconProps) => <Svg {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></Svg>;
export const FileIcon = (p: IconProps) => <Svg {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></Svg>;
export const LockIcon = (p: IconProps) => <Svg {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></Svg>;
export const GlobeIcon = (p: IconProps) => <Svg {...p}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3z" /></Svg>;
export const DownloadIcon = (p: IconProps) => <Svg {...p}><path d="M12 4v11M7 11l5 5 5-5M5 20h14" /></Svg>;
export const UploadIcon = (p: IconProps) => <Svg {...p}><path d="M12 16V5M7 9l5-5 5 5M5 20h14" /></Svg>;
export const SearchIcon = (p: IconProps) => <Svg {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></Svg>;
export const ExternalIcon = (p: IconProps) => <Svg {...p}><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></Svg>;
export const CloseIcon = (p: IconProps) => <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>;
export const ChevronIcon = ({ direction, ...p }: IconProps & { direction: "left" | "right" }) => (
  <Svg {...p}><path d={direction === "left" ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} /></Svg>
);
export const EditIcon = (p: IconProps) => <Svg {...p}><path d="M4 20h4L19 9l-4-4L4 16zM13.5 6.5l4 4" /></Svg>;
