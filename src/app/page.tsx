import { redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth";

const roleRedirects: Record<string, string> = {
  SUPER_ADMIN: "/admin",
  TEACHER: "/teacher",
  STUDENT: "/student",
  PARENT: "/parent",
};

export default async function Home() {
  const session = await getAuthSession();

  if (session?.user) {
    const role = session.user.role;
    redirect(roleRedirects[role] || "/login");
  }

  redirect("/login");
}
