"use client";

import { AlertCircle, Check, Copy, Loader2, Plus, UserPlus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { apiFetch } from "@/lib/client";
import { canManageSharing, type Access, type ShareRole } from "@/lib/permissions";
import type { Collaborator, PublicUser } from "@/lib/repo";
import { cn } from "@/lib/utils";

export function ShareDialog({
  open,
  onClose,
  documentId,
  documentTitle,
  access,
  ownerId,
  currentUser,
  workspaceUsers,
  collaborators,
  onCollaboratorsChange,
}: {
  open: boolean;
  onClose: () => void;
  documentId: string;
  documentTitle: string;
  access: Exclude<Access, null>;
  ownerId: string;
  currentUser: PublicUser;
  workspaceUsers: PublicUser[];
  collaborators: Collaborator[];
  onCollaboratorsChange: (next: Collaborator[]) => void;
}) {
  const { toast } = useToast();
  const manage = canManageSharing(access);

  const [email, setEmail] = useState("");
  const [role, setRole] = useState<ShareRole>("viewer");
  const [pending, setPending] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const owner = useMemo(
    () =>
      workspaceUsers.find((person) => person.id === ownerId) ??
      (currentUser.id === ownerId ? currentUser : null),
    [workspaceUsers, ownerId, currentUser],
  );

  const available = workspaceUsers.filter(
    (person) =>
      person.id !== ownerId && !collaborators.some((collaborator) => collaborator.id === person.id),
  );

  async function invite(inviteEmail: string, inviteRole: ShareRole) {
    setPending(true);
    setError(null);
    try {
      const result = await apiFetch<{ collaborators: Collaborator[] }>(
        `/api/documents/${documentId}/shares`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
        },
      );
      onCollaboratorsChange(result.collaborators);
      setEmail("");
      toast({
        title: "Access granted",
        description: `${inviteEmail} can ${inviteRole === "editor" ? "edit" : "view"} this document.`,
        tone: "success",
      });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't share this document.");
    } finally {
      setPending(false);
    }
  }

  async function changeRole(collaborator: Collaborator, nextRole: ShareRole) {
    if (collaborator.role === nextRole) return;
    setPending(true);
    setError(null);
    try {
      const result = await apiFetch<{ collaborators: Collaborator[] }>(
        `/api/documents/${documentId}/shares`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: collaborator.email, role: nextRole }),
        },
      );
      onCollaboratorsChange(result.collaborators);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't update access.");
    } finally {
      setPending(false);
    }
  }

  async function remove(collaborator: Collaborator) {
    setRemoving(collaborator.id);
    setError(null);
    try {
      const result = await apiFetch<{ collaborators: Collaborator[] }>(
        `/api/documents/${documentId}/shares?userId=${collaborator.id}`,
        { method: "DELETE" },
      );
      onCollaboratorsChange(result.collaborators);
      toast({ title: `Removed ${collaborator.name}`, tone: "success" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't remove access.");
    } finally {
      setRemoving(null);
    }
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/doc/${documentId}`);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Couldn't copy the link", tone: "error" });
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Share document"
      description={documentTitle}
      footer={
        <>
          <Button variant="secondary" onClick={() => void copyLink()}>
            {copied ? <Check className="size-4 text-accent" /> : <Copy className="size-4" />}
            {copied ? "Link copied" : "Copy link"}
          </Button>
          <Button onClick={onClose}>Done</Button>
        </>
      }
    >
      <div className="space-y-5">
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-[0.13em] text-ink-faint">
            People with access
          </h3>
          <ul className="mt-2.5 space-y-1">
            {owner && (
              <li className="flex items-center gap-3 rounded-lg px-1 py-1.5">
                <Avatar name={owner.name} color={owner.color} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {owner.name}
                    {owner.id === currentUser.id && (
                      <span className="ml-1.5 text-[11px] font-normal text-ink-faint">You</span>
                    )}
                  </p>
                  <p className="truncate text-[11.5px] text-ink-faint">{owner.email}</p>
                </div>
                <span className="rounded-full bg-paper-deep px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-ink-soft">
                  Owner
                </span>
              </li>
            )}

            {collaborators.map((collaborator) => (
              <li
                key={collaborator.id}
                className="flex items-center gap-3 rounded-lg px-1 py-1.5"
              >
                <Avatar name={collaborator.name} color={collaborator.color} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium text-ink">
                    {collaborator.name}
                    {collaborator.id === currentUser.id && (
                      <span className="ml-1.5 text-[11px] font-normal text-ink-faint">You</span>
                    )}
                  </p>
                  <p className="truncate text-[11.5px] text-ink-faint">{collaborator.email}</p>
                </div>

                {manage ? (
                  <div className="flex items-center gap-1">
                    <select
                      aria-label={`Access for ${collaborator.name}`}
                      value={collaborator.role}
                      disabled={pending}
                      onChange={(event) =>
                        void changeRole(collaborator, event.target.value as ShareRole)
                      }
                      className="h-7 rounded-md border border-line bg-surface px-1.5 text-[11.5px] font-medium text-ink-soft focus:border-accent focus:outline-none"
                    >
                      <option value="viewer">Can view</option>
                      <option value="editor">Can edit</option>
                    </select>
                    <button
                      type="button"
                      aria-label={`Remove ${collaborator.name}`}
                      disabled={removing === collaborator.id}
                      onClick={() => void remove(collaborator)}
                      className="grid size-7 place-items-center rounded-md text-ink-faint transition hover:bg-danger-soft hover:text-danger disabled:opacity-50"
                    >
                      {removing === collaborator.id ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <X className="size-3.5" />
                      )}
                    </button>
                  </div>
                ) : (
                  <span
                    className={cn(
                      "rounded-full px-2 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide",
                      collaborator.role === "editor"
                        ? "bg-accent-soft text-accent-strong"
                        : "bg-amber-soft text-amber-ink",
                    )}
                  >
                    {collaborator.role === "editor" ? "Can edit" : "Can view"}
                  </span>
                )}
              </li>
            ))}

            {!owner && collaborators.length === 0 && (
              <li className="px-1 py-2 text-[12.5px] text-ink-faint">Only you have access.</li>
            )}
          </ul>
        </section>

        {manage ? (
          <section className="rounded-xl border border-line bg-paper/40 p-3.5">
            <h3 className="flex items-center gap-1.5 text-[12px] font-semibold text-ink">
              <UserPlus className="size-3.5 text-ink-faint" /> Invite a teammate
            </h3>

            <div className="mt-2.5 flex flex-col gap-2 sm:flex-row">
              <input
                type="email"
                value={email}
                list="workspace-members"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError(null);
                }}
                placeholder="teammate@ajaia.dev"
                aria-label="Email address to invite"
                className="h-9 min-w-0 flex-1 rounded-lg border border-line-strong/80 bg-surface px-2.5 text-[13px] text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/10"
              />
              <select
                value={role}
                onChange={(event) => setRole(event.target.value as ShareRole)}
                aria-label="Access level"
                className="h-9 rounded-lg border border-line-strong/80 bg-surface px-2 text-[12.5px] font-medium text-ink-soft focus:border-accent focus:outline-none"
              >
                <option value="viewer">Can view</option>
                <option value="editor">Can edit</option>
              </select>
              <Button
                size="md"
                className="h-9"
                disabled={pending || email.trim().length === 0}
                onClick={() => {
                  if (!email.trim()) {
                    setError("Enter an email address.");
                    return;
                  }
                  void invite(email.trim(), role);
                }}
              >
                {pending ? <Loader2 className="size-4 animate-spin" /> : "Invite"}
              </Button>
            </div>

            <datalist id="workspace-members">
              {available.map((person) => (
                <option key={person.id} value={person.email}>
                  {person.name}
                </option>
              ))}
            </datalist>

            {available.length > 0 && (
              <div className="mt-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-ink-faint">
                  Workspace
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {available.map((person) => (
                    <button
                      key={person.id}
                      type="button"
                      onClick={() => setEmail(person.email)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface py-1 pl-1 pr-2.5 text-[11.5px] font-medium text-ink-soft transition hover:border-line-strong hover:text-ink"
                    >
                      <Avatar name={person.name} color={person.color} size="xs" />
                      {person.name.split(" ")[0]}
                      <Plus className="size-3 text-ink-faint" />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && (
              <p
                role="alert"
                className="mt-2.5 flex items-start gap-1.5 text-[12px] leading-5 text-danger"
              >
                <AlertCircle className="mt-0.5 size-3.5 shrink-0" />
                {error}
              </p>
            )}
          </section>
        ) : (
          <p className="rounded-xl border border-line bg-paper/50 px-3.5 py-3 text-[12.5px] leading-5 text-ink-soft">
            Only the document owner can invite people or change access.
          </p>
        )}

        <p className="text-[11.5px] leading-5 text-ink-faint">
          Access is invite-only. Sharing the link does not grant access — the recipient must already
          have view or edit permission.
        </p>
      </div>
    </Modal>
  );
}
