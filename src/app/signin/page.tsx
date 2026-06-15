import { redirect } from "next/navigation";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getSession } from "@/server/auth/guards";
import { SignInForm } from "./signin-form";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getSession();
  if (session?.user) redirect("/book");

  const { callbackUrl } = await searchParams;

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader>
          <CardTitle>Sign in</CardTitle>
          <CardDescription>
            Use your institutional account. Only allowed email domains can sign
            in.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SignInForm callbackUrl={callbackUrl ?? "/book"} />
        </CardContent>
      </Card>
    </div>
  );
}
