"use client";

import { useActionState, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  updateProfileAction,
  type UpdateProfileActionState,
} from "@/features/auth/update-profile-action";

const FIELD_CLASS =
  "h-11 w-full rounded-xl border border-brand/20 bg-white px-3 text-product-ink outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20";

type PersonalInformationFormProps = {
  locale: string;
  firstName: string;
  lastName: string;
  email: string;
  labels: {
    title: string;
    firstName: string;
    lastName: string;
    email: string;
    cancel: string;
    save: string;
    saving: string;
    firstNamePlaceholder: string;
    lastNamePlaceholder: string;
    emailPlaceholder: string;
  };
};

const initialState: UpdateProfileActionState = {};

export function PersonalInformationForm({
  locale,
  firstName,
  lastName,
  email,
  labels,
}: PersonalInformationFormProps) {
  const action = updateProfileAction.bind(null, locale);
  const [state, formAction, isPending] = useActionState(action, initialState);
  const [values, setValues] = useState({
    firstName,
    lastName,
    email,
  });

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) setValues({ firstName, lastName, email });
    });
    return () => {
      cancelled = true;
    };
  }, [firstName, lastName, email]);

  function resetToSaved(): void {
    setValues({ firstName, lastName, email });
  }

  return (
    <Card className="border-0 bg-transparent p-0 shadow-none md:rounded-[24px] md:border md:border-brand/15 md:bg-white md:p-7 md:shadow-[0_14px_40px_-28px_rgba(28,25,23,0.35)] lg:p-8">
      <div className="mb-6 border-b border-brand/10 pb-4 sm:mb-8 sm:pb-5">
        <h1 className="font-display text-lg font-black tracking-tight text-product-ink sm:text-xl">
          {labels.title}
        </h1>
      </div>

      <form
        action={formAction}
        className="mx-auto max-w-xl space-y-6 lg:mx-0 lg:max-w-2xl"
      >
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-8">
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            {labels.firstName}
            <input
              name="firstName"
              required
              value={values.firstName}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  firstName: event.target.value,
                }))
              }
              placeholder={labels.firstNamePlaceholder}
              className={FIELD_CLASS}
              autoComplete="given-name"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
            {labels.lastName}
            <input
              name="lastName"
              required
              value={values.lastName}
              onChange={(event) =>
                setValues((prev) => ({
                  ...prev,
                  lastName: event.target.value,
                }))
              }
              placeholder={labels.lastNamePlaceholder}
              className={FIELD_CLASS}
              autoComplete="family-name"
            />
          </label>
        </div>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-gray-700">
          {labels.email}
          <input
            name="email"
            type="email"
            required
            value={values.email}
            onChange={(event) =>
              setValues((prev) => ({ ...prev, email: event.target.value }))
            }
            placeholder={labels.emailPlaceholder}
            className={FIELD_CLASS}
            autoComplete="email"
          />
        </label>

        {state.error ? (
          <p className="text-sm text-red-700" role="alert">
            {state.error}
          </p>
        ) : null}
        {state.success ? (
          <p className="text-sm text-green-700" role="status">
            {state.success}
          </p>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:items-center sm:gap-4 sm:pt-4">
          <Button
            type="button"
            variant="outline"
            className="h-11 w-full sm:w-auto"
            onClick={resetToSaved}
            disabled={isPending}
          >
            {labels.cancel}
          </Button>
          <Button
            type="submit"
            variant="primary"
            className="h-11 w-full !bg-brand text-white hover:!brightness-95 focus:!ring-brand sm:w-auto"
            disabled={isPending}
          >
            {isPending ? labels.saving : labels.save}
          </Button>
        </div>
      </form>
    </Card>
  );
}
