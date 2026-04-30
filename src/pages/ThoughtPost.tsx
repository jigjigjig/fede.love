import { useParams, Link } from "react-router-dom";
import Markdown from "react-markdown";
import { getThought } from "../lib/thoughts";

const ThoughtPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const thought = slug ? getThought(slug) : undefined;

  if (!thought) {
    return (
      <div className="min-h-viewport max-w-[640px] box-content px-6 py-20 sm:px-12 md:px-24 lg:px-32">
        <Link
          to="/"
          className="text-muted-foreground hover:text-accent hover-glow"
        >
          &lt; back
        </Link>
        <p className="mt-10 text-muted-foreground">thought not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-viewport max-w-[640px] box-content px-6 py-20 sm:px-12 md:px-24 lg:px-32 animate-fade-in">
      <Link
        to="/"
        className="text-muted-foreground hover:text-accent hover-glow"
      >
        &lt; back
      </Link>

      <header className="mt-10 mb-8">
        <h1 className="text-foreground text-base">{thought.title}</h1>
        <span className="text-muted-foreground text-[13px]">{thought.date}</span>
      </header>

      <article className="prose">
        <Markdown>{thought.body}</Markdown>
      </article>
    </div>
  );
};

export default ThoughtPost;
