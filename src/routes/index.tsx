import { createFileRoute, redirect } from "@tanstack/react-router";

// No head() here: the home route inherits title/description/og/twitter from
// __root.tsx, and ships no og:image so serve-time hosting can inject the
// project's social preview (explicit og:image or latest screenshot).
export const Route = createFileRoute("/")({
  beforeLoad: () => { throw redirect({ to: "/auth" }); },
  head: () => ({ meta: [{ title: "Собрано CRM" }, { name: "description", content: "CRM для кинологов, тренеров и небольших студий." }, { property: "og:title", content: "Собрано CRM" }, { property: "og:description", content: "Клиенты, расписание и оплаты в одном спокойном месте." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" }] }),
});
