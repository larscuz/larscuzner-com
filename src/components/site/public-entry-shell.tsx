import { getMediaLibrary } from "@/lib/media-library";
import { getRecoverySnapshot } from "@/lib/wordpress-data";
import { isAdminAuthenticated } from "@/lib/server/auth";
import { saveWorkspaceEntryFromFrontend, type WorkspaceEntry } from "@/lib/server/workspace-store";
import { FrontendEntryEditor } from "@/components/site/frontend-entry-editor";

export async function PublicEntryShell({ entry }: { entry: WorkspaceEntry }) {
  const snapshot = getRecoverySnapshot();
  const attachments = snapshot.attachments.filter((attachment) => entry.linkedAttachmentIds.includes(attachment.id));
  const mediaLibrary = getMediaLibrary();
  const canEdit = await isAdminAuthenticated();

  return (
    <FrontendEntryEditor
      entry={entry}
      attachments={attachments}
      mediaLibraryItems={mediaLibrary.items}
      canEdit={canEdit}
      saveAction={saveWorkspaceEntryFromFrontend}
    />
  );
}
