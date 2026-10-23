import Link from "next/link";
import { messages } from "@/messages";

export default function NotFound() {
  const t = messages.en;
  return (
    <div className="container-site py-24">
      <p className="pixel text-sun">404</p>
      <h1 className="mt-3 text-3xl font-bold">{t.notFound.title}</h1>
      <p className="mt-2 text-ink-2">
        {t.notFound.text} · {messages.fr.notFound.text}
      </p>
      <Link href="/" className="btn mt-6">
        {t.notFound.home}
      </Link>
    </div>
  );
}
