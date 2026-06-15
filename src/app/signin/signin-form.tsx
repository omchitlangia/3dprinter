"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Loader2, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function SignInForm({ callbackUrl }: { callbackUrl: string }) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  async function onEmail(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    // Routes to /signin/verify on success, /signin/error on a rejected domain.
    await signIn("email", { email, callbackUrl });
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <form onSubmit={onEmail} className="space-y-3">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email magic link</Label>
          <Input
            id="email"
            type="email"
            required
            placeholder="you@snu.edu.in"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <Button type="submit" className="w-full" disabled={loading}>
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Mail className="h-4 w-4" />
          )}
          Send magic link
        </Button>
      </form>
    </div>
  );
}
