"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  ADMIN_SECTION_TITLE,
} from "@/features/admin/ui/admin-form-classes";
import { updateUserRoleAction } from "@/features/users/application/update-user";
import {
  USER_ROLES,
  type UserRole,
} from "@/features/users/domain/user-lifecycle";

type UpdateUserRoleFormProps = {
  locale: string;
  userId: string;
  currentRole: UserRole;
  disabled?: boolean;
};

export function UpdateUserRoleForm({
  locale,
  userId,
  currentRole,
  disabled = false,
}: UpdateUserRoleFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<UserRole>(currentRole);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className="p-6">
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();

          startTransition(async () => {
            setError(null);
            if (role === currentRole) {
              return;
            }
            const result = await updateUserRoleAction(locale, {
              userId,
              role,
            });
            if (!result.ok) {
              setError(result.error.message);
              return;
            }
            router.refresh();
          });
        }}
      >
        <h3 className={ADMIN_SECTION_TITLE}>Role</h3>
        <p className="text-sm text-[#5c564e]">
          Current: <strong className="text-[#1f1a17]">{currentRole}</strong>
        </p>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-[#3e573d]">New role</legend>
          <div className="flex flex-wrap gap-2 rounded-2xl border border-[#ead7bf] bg-[#fffaf2] p-2">
            {USER_ROLES.map((item) => {
              const isActive = role === item;
              return (
                <button
                  key={item}
                  type="button"
                  disabled={disabled || isPending}
                  onClick={() => setRole(item)}
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
        <Button
          type="submit"
          size="sm"
          disabled={disabled || isPending || role === currentRole}
        >
          {isPending ? "Updating…" : "Update role"}
        </Button>
      </form>
    </Card>
  );
}
