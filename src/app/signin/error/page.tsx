import Link from "next/link";
import { ShieldAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

const MESSAGES: Record<string, string> = {
  AccessDenied:
    "Your email domain isn't permitted to use this system. Please sign in with your institutional account.",
  Verification: "The sign-in link is invalid or has expired. Request a new one.",
  Configuration: "There's a server configuration problem. Contact the lab admin.",
};

export default async function AuthErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  const message =
    (error && MESSAGES[error]) ?? "Something went wrong during sign-in.";

  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader className="items-center text-center">
          <ShieldAlert className="h-8 w-8 text-destructive" />
          <CardTitle>Sign-in failed</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardFooter className="justify-center">
          <Button asChild variant="outline">
            <Link href="/signin">Back to sign in</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
