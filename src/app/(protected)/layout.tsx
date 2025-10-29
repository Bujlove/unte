import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center space-x-8">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Image src="/logo.svg" alt="Unte Logo" width={32} height={32} />
                <span className="text-xl font-bold text-primary">Unte</span>
              </Link>
              <div className="hidden md:flex space-x-4">
                <Link
                  href="/dashboard"
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Поиск
                </Link>
                <Link
                  href="/candidates/saved"
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  Избранное
                </Link>
                <Link
                  href="/search/history"
                  className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
                >
                  История
                </Link>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-600">
                {profile?.subscription_type === "pro" ? (
                  <span className="text-primary font-semibold">Pro</span>
                ) : (
                  <span>
                    {profile?.searches_count || 0} / {profile?.searches_limit || 10} поисков
                  </span>
                )}
              </div>
              <Link
                href="/settings"
                className="text-gray-700 hover:text-primary px-3 py-2 rounded-md text-sm font-medium"
              >
                Настройки
              </Link>
              <Link
                href="/billing"
                className="bg-primary text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-primary-600"
              >
                Подписка
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <main>{children}</main>
    </div>
  );
}

