import { adminDict } from "@/lib/i18n-server";
import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/admin";
  const configured = Boolean(process.env.ADMIN_PASSWORD);
  const { d } = await adminDict();
  return (
    <div className="mx-auto mt-16 w-full max-w-sm">
      <h1 className="mb-4 text-lg font-bold">{d.login}</h1>
      {!configured ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">{d.noPasswordEnv}</p>
      ) : (
        <LoginForm next={next} placeholder={d.password} buttonLabel={d.loginButton} />
      )}
    </div>
  );
}
