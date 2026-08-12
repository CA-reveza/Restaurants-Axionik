// Every menu item image (from Unsplash, by default) was requested at a fixed
// w=800&q=80 regardless of where it's actually rendered — a 50x50px cart
// thumbnail and a 230px admin grid card and a full-width detail sheet image
// were all downloading the exact same ~800px-wide asset. On a restaurant's
// captive-portal wifi, serving the biggest size everywhere is the worst case
// for every screen except the one that actually needs it.
//
// Unsplash's image URLs accept `w=`/`q=` query params to resize/recompress
// server-side, so we can right-size per call site instead of per stored URL.
// Non-Unsplash URLs (a restaurant's own uploaded image_url, for instance)
// are returned unchanged since we can't assume they support the same params.
export const sizedImageUrl = (url, width) => {
  if (!url || typeof url !== "string") return url;
  if (!url.includes("images.unsplash.com")) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("w", String(width));
    u.searchParams.set("q", "75");
    return u.toString();
  } catch {
    return url;
  }
};
