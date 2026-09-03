"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import { updateUserStatusAction } from "@/features/users/application/update-user";
import type { UserStatus } from "@/features/users/domain/user-lifecycle";

type UpdateUserStatusFormProps = {
  locale: string;
  userId: string;
  currentStatus: UserStatus;
  eligibleStatuses: UserStatus[];
};

export function UpdateUserStatusForm({
  locale,
  userId,
  currentStatus,
  eligibleStatuses,
}: UpdateUserStatusFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(eligibleStatuses[0] ?? "");
  const [isPending, startTransition] = useTransition();

  if (eligibleStatuses.length === 0) {
    return (
      <p className="text-sm text-[#5c564e]">
        Terminal status — no further transitions.
      </p>
    );
  }

  return (
    <Card className="p-6">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();

          startTransition(async () => {
            setError(null);
            const result = await updateUserStatusAction(locale, {
              userId,
              status: status as UserStatus,
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            router.refresh();
          });
        }}
      >
        <h3 className={ADMIN_SECTION_TITLE}>Status</h3>
        <p className="text-sm text-[#5c564e]">
          Current: <strong className="text-[#1f1a17]">{currentStatus}</strong>
        </p>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[#3e573d]">
            New status
          </legend>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-[#ead7bf] bg-[#fffaf2] p-2">
            {eligibleStatuses.map((item) => {
              const isActive = status === item;
              return (
                <button
                  key={item}
                  type="button"
                  disabled={isPending}
                  onClick={() => setStatus(item)}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-[#1f3a22] text-[#fffdf8]"
                      : "border border-[#ead7bf] bg-white text-[#5c564e] hover:border-[#ff7f20]/45 hover:bg-[#fff4eb] hover:text-[#1f1a17]"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                  aria-pressed={isActive}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </fieldset>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? "Updating…" : "Update status"}
        </Button>
      </form>
    </Card>
  );
}
