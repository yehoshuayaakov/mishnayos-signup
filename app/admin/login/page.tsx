import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";
import { getOrganizerUser } from "@/lib/organizer-auth";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const user = await getOrganizerUser();
  if (user) redirect("/admin");
  const query = await searchParams;

  return (
    <main
      dir="rtl"
      className="campaign-root flex min-h-screen items-center justify-center bg-[#f5f7f9] px-4 py-10"
    >
      <AdminLoginForm invalidLink={query.error === "invalid_link"} />
    </main>
  );
}
