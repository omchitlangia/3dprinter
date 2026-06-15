import { MailCheck } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function VerifyRequestPage() {
  return (
    <div className="mx-auto max-w-md py-8">
      <Card>
        <CardHeader className="items-center text-center">
          <MailCheck className="h-8 w-8 text-primary" />
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            A sign-in link has been sent to your email address. It expires in 15
            minutes and can be used once.
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          Didn&apos;t get it? Check spam, or request a new link from the sign-in
          page.
        </CardContent>
      </Card>
    </div>
  );
}
