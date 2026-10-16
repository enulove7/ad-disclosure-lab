import { LoginForm } from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage(props: PageProps<"/admin/login">) {
  const sp = await props.searchParams;
  const next = typeof sp.next === "string" ? sp.next : "/admin";
  const configured = Boolean(process.env.ADMIN_PASSWORD);
  return (
    <div className="mx-auto mt-16 w-full max-w-sm">
      <h1 className="mb-4 text-lg font-bold">管理者ログイン</h1>
      {!configured ? (
        <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
          環境変数 <code>ADMIN_PASSWORD</code> が設定されていません。.env.local に設定して再起動してください。
        </p>
      ) : (
        <LoginForm next={next} />
      )}
    </div>
  );
}
