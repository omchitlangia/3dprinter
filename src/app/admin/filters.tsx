"use client";

import { useRouter, useSearchParams } from "next/navigation";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { APPLICATION_STATUSES } from "@/lib/validation";

const ALL = "__all__";

const STATUS_LABEL: Record<string, string> = {
  PENDING: "Pending review",
  APPROVED: "Approved",
  REJECTED: "Rejected",
};

export function AdminFilters({ current }: { current: { status?: string } }) {
  const router = useRouter();
  const params = useSearchParams();

  function update(status: string | undefined) {
    const sp = new URLSearchParams(params.toString());
    if (!status || status === ALL) sp.delete("status");
    else sp.set("status", status);
    router.push(`/admin?${sp.toString()}`);
  }

  return (
    <div className="flex flex-wrap items-center gap-2 pt-2">
      <Select value={current.status ?? ALL} onValueChange={(v) => update(v)}>
        <SelectTrigger className="w-48">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>All statuses</SelectItem>
          {APPLICATION_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {STATUS_LABEL[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
