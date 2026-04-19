type Props = {
  url: string;
  handleRead: () => void;
};

export default function PostLink(props: Props) {
  return (
    <a
      target="_blank"
      rel="noopener noreferrer"
      href={props.url}
      onClick={props.handleRead}
      className="bg-text text-bg px-2 py-1"
    >
      Open &middot; Read
    </a>
  );
}
