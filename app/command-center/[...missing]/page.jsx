import { notFound } from "next/navigation";

// Unknown staff URLs 404 inside this route tree instead of the root
// `_not-found` route, so the server and the client agree on the pathname and
// the root-layout sunset banner (hidden on /command-center) hydrates cleanly.
export default function CommandCenterNotFound() {
  notFound();
}
