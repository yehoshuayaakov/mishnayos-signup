import { redirect } from "next/navigation";
import { Banner } from "@/components/ds/Banner";

export const dynamic = "force-dynamic";

export default function Home() {
  const slug = process.env.DEFAULT_CAMPAIGN?.trim();
  if (slug) redirect(`/${slug}`);

  return (
    <main className="mx-auto max-w-[720px] px-4 py-12">
      <Banner>לא הוגדרה חלוקה ברירת מחדל.</Banner>
    </main>
  );
}
