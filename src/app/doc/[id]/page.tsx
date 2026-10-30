import { notFound } from "next/navigation";
import { DocumentEditor } from "@/components/editor/document-editor";
import { requireUser } from "@/lib/auth";
import { getReadyDb } from "@/lib/db";
import { getDocumentForUser, listWorkspaceUsers } from "@/lib/repo";

export const dynamic = "force-dynamic";

export default async function DocumentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;

  const document = await getDocumentForUser(id, user.id);
  if (!document) notFound();

  const db = await getReadyDb();
  const workspaceUsers = await listWorkspaceUsers(db);

  return <DocumentEditor user={user} document={document} workspaceUsers={workspaceUsers} />;
}
