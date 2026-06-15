"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const STATUSES = [
  "confirmed",
  "printing",
  "ready_for_pickup",
  "completed",
  "cancelled",
  "rejected",
] as const;

const ALL = "__all__";

export function AdminFilters({
  printers,
  current,
}: {
  printers: { id: string; name: string }[];
  current: { status?: string; printerId?: string; q?: string };
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(current.q ?? "");

  function update(patch: Record<string, string | undefined>) {
    const sp = new URLSearchParams(params.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (!v || v === ALL) sp.delete(k);
      else sp.set(k, v);
    }
    router.push(`/admin?${sp.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <Select
        value={current.status ?? ALL}
        onValueChange={(v) => update({ status: v })}
      >
        <SelectTrigger className="w-44">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {s.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={current.printerId ?? ALL}
        onValueChange={(v) => update({ printerId: v })}
      >
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All printers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All printers</SelectItem>
          {printers.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <form
        className="flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          update({ q });
        }}
      >
        <Input
          placeholder="Search user / file…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-56"
        />
        <Button type="submit" variant="outline" size="sm">
          Search
        </Button>
      </form>

      {(current.status || current.printerId || current.q) && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            router.push("/admin");
          }}
        >
          Clear
        </Button>
      )}
    </div>
  );
}
