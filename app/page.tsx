import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default function Home() {
  const slug = process.env.DEFAULT_CAMPAIGN?.trim();
  if (slug) redirect(`/${slug}`);

  return (
    <main className="container">
      <div className="banner">
        <p>לא הוגדרה חלוקה ברירת מחדל.</p>
      </div>
    </main>
  );
}
