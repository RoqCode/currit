type Props = {
  url: string;
  isRead: boolean;
  handleRead: () => void;
};

export default function PostLink(props: Props) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={props.url}
      onClick={props.handleRead}
      className="inline-flex items-center justify-center border border-primary bg-primary px-4 py-2 font-ui text-xs font-bold uppercase tracking-[0.16em] text-bg transition-colors hover:border-primary-hover hover:bg-primary-hover"
    >
      {props.isRead ? "Open" : "Read"}
    </a>
  );
}
