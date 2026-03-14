import { HomepageEditor } from "@/components/site/homepage-editor";
import { isAdminAuthenticated } from "@/lib/server/auth";
import { getFeaturedEntries } from "@/lib/server/public-site";
import { readHomepageDocument, saveHomepageDocument } from "@/lib/server/site-documents";

export default async function Home() {
  const [{ featuredPages, featuredPosts, pages, posts }, homepageDocument, canEdit] = await Promise.all([
    getFeaturedEntries(),
    readHomepageDocument(),
    isAdminAuthenticated(),
  ]);

  return (
    <HomepageEditor
      document={homepageDocument}
      featuredPages={featuredPages}
      featuredPosts={featuredPosts}
      pages={pages}
      posts={posts}
      canEdit={canEdit}
      saveAction={saveHomepageDocument}
    />
  );
}
