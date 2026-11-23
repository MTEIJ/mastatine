interface PageHeaderProps {
  title: string;
  intro?: string;
  className?: string;
  /**
   * In the installed app the top app bar already names the section, so the big title is kept for screen readers only
   * and the intro leads the page. Status pages whose title is the message ("You are subscribed") keep it.
   */
  keepInApp?: boolean;
}

export default function PageHeader({ title, intro, className = "", keepInApp = false }: PageHeaderProps) {
  return (
    <div className={`page-header container-prose pb-10 pt-14 sm:pt-16 ${keepInApp ? "page-header--keep" : ""} ${className}`}>
      <h1 className="text-4xl font-extrabold sm:text-5xl">{title}</h1>
      <span className="page-header__bar mt-5 block h-1 w-14 rounded-full bg-accent" aria-hidden />
      {intro && <p className="page-header__intro mt-6 text-lg text-muted">{intro}</p>}
    </div>
  );
}
