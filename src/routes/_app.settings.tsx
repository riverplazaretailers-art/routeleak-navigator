import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";

import { PageHeader } from "@/components/app-shell";
import { ErrorState, LoadingBlock, PermissionDenied, SuccessNote } from "@/components/states";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { can, useSession } from "@/hooks/use-session";
import { getProductApi, type AccountSettings } from "@/lib/product-api";

export const Route = createFileRoute("/_app/settings")({
  head: () => ({
    meta: [
      { title: "Settings — RouteLeak" },
      {
        name: "description",
        content:
          "Account name, timezone, currency, exception value threshold and run notifications for your RouteLeak workspace.",
      },
      { property: "og:title", content: "RouteLeak settings" },
      {
        property: "og:description",
        content: "Workspace configuration for reconciliation runs and notifications.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const api = getProductApi();
  const queryClient = useQueryClient();
  const session = useSession();
  const editable = can(session.data, "settings:write");

  const settings = useQuery({
    queryKey: ["settings"],
    queryFn: () => api.getSettings(),
  });

  const [draft, setDraft] = useState<AccountSettings | null>(null);
  useEffect(() => {
    if (settings.data) setDraft(settings.data);
  }, [settings.data]);

  const save = useMutation({
    mutationFn: (input: AccountSettings) => api.updateSettings(input),
    onSuccess: (updated) => {
      queryClient.setQueryData(["settings"], updated);
    },
  });

  if (settings.isPending || !draft) {
    return (
      <>
        <PageHeader title="Settings" />
        {settings.isError ? (
          <ErrorState error={settings.error} onRetry={() => settings.refetch()} />
        ) : (
          <LoadingBlock label="Loading settings" />
        )}
      </>
    );
  }

  function set<K extends keyof AccountSettings>(key: K, value: AccountSettings[K]) {
    setDraft((prev) => (prev ? { ...prev, [key]: value } : prev));
  }

  return (
    <>
      <PageHeader
        title="Settings"
        description="Configuration is stored by the RouteLeak backend and applies to every run in this account."
      />

      {!editable ? (
        <PermissionDenied message="Your role can view these settings but not change them. Ask an account owner." />
      ) : null}

      <form
        className="panel mt-4 max-w-2xl space-y-5 p-5"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          if (draft) save.mutate(draft);
        }}
      >
        <fieldset disabled={!editable} className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="accountName">Account name</Label>
              <Input
                id="accountName"
                value={draft.accountName}
                onChange={(e) => set("accountName", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={draft.timezone}
                onChange={(e) => set("timezone", e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="currency">Currency</Label>
              <Input
                id="currency"
                value={draft.currency}
                onChange={(e) => set("currency", e.target.value.toUpperCase())}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="threshold">Minimum recoverable value (minor units)</Label>
              <Input
                id="threshold"
                type="number"
                min={0}
                step={100}
                value={draft.minimumRecoverableAmount}
                onChange={(e) => set("minimumRecoverableAmount", Number(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Exceptions below this value are suppressed by the backend.
              </p>
            </div>
          </div>

          <div className="space-y-3 border-t border-border pt-4">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notifyComplete" className="font-normal">
                Email me when a run completes
              </Label>
              <Switch
                id="notifyComplete"
                checked={draft.notifyOnRunComplete}
                onCheckedChange={(v) => set("notifyOnRunComplete", v)}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="notifyFailure" className="font-normal">
                Email me when a run fails
              </Label>
              <Switch
                id="notifyFailure"
                checked={draft.notifyOnRunFailure}
                onCheckedChange={(v) => set("notifyOnRunFailure", v)}
              />
            </div>
          </div>

          {save.isError ? <ErrorState error={save.error} title="Settings not saved" /> : null}
          {save.isSuccess ? <SuccessNote>Settings saved.</SuccessNote> : null}

          <Button type="submit" disabled={save.isPending}>
            {save.isPending ? "Saving…" : "Save settings"}
          </Button>
        </fieldset>
      </form>
    </>
  );
}
