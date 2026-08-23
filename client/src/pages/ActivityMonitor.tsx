import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { AlertTriangle, RefreshCw, ShieldCheck, UserRound } from "lucide-react";

function formatTimestamp(value: Date | string | null) {
  if (!value) return "Time unavailable";
  const timestamp = new Date(value);
  if (Number.isNaN(timestamp.getTime())) return "Time unavailable";
  return timestamp.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function EventSkeleton() {
  return (
    <div className="space-y-3" aria-label="Loading activity">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-24 animate-pulse rounded-3xl border border-[#e4ddd2] bg-[#ebe4da]"
        />
      ))}
    </div>
  );
}

export default function ActivityMonitor() {
  const { loading: authLoading, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const activity = trpc.admin.activity.list.useQuery(
    { limit: 100 },
    { enabled: isAdmin }
  );

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-[#8b7560]">Administrator workspace</p>
            <h1 className="mt-3 font-display text-4xl tracking-[-0.045em] text-[#201d19] sm:text-5xl">
              Owner activity.
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6e665d] sm:text-base">
              Review the latest 100 venue-owner account, venue, category, and menu changes. Times are displayed in your local timezone.
            </p>
          </div>
          {isAdmin && (
            <Button
              onClick={() => activity.refetch()}
              disabled={activity.isFetching}
              variant="outline"
              className="rounded-full border-[#cfc4b5] bg-[#fbf9f5] text-[#201d19] hover:bg-white"
            >
              <RefreshCw className={`mr-2 h-4 w-4 ${activity.isFetching ? "animate-spin" : ""}`} />
              Refresh activity
            </Button>
          )}
        </div>

        {!authLoading && !isAdmin ? (
          <section className="mt-8 rounded-[2rem] border border-[#e4ddd2] bg-[#fbf9f5] p-8 text-center sm:p-12">
            <ShieldCheck className="mx-auto h-8 w-8 text-[#ed5739]" />
            <h2 className="mt-5 font-display text-3xl text-[#201d19]">Administrator access required</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6e665d]">
              This activity monitor is reserved for QRServe administrators. Venue owners can continue managing only their own menus from the service desk.
            </p>
          </section>
        ) : activity.isLoading || authLoading ? (
          <div className="mt-8"><EventSkeleton /></div>
        ) : activity.isError ? (
          <section className="mt-8 rounded-[2rem] border border-[#f0c1b7] bg-[#fff6f3] p-8 sm:p-10">
            <AlertTriangle className="h-7 w-7 text-[#c6422c]" />
            <h2 className="mt-4 font-display text-3xl text-[#201d19]">Activity could not be loaded</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#6e665d]">
              Please refresh and try again. Access is checked on the server before activity records are returned.
            </p>
            <Button onClick={() => activity.refetch()} className="mt-6 rounded-full bg-[#201d19] text-white hover:bg-[#3a342e]">
              Try again
            </Button>
          </section>
        ) : !activity.data?.length ? (
          <section className="mt-8 rounded-[2rem] border border-dashed border-[#cfc4b5] bg-[#fbf9f5] p-8 text-center sm:p-12">
            <UserRound className="mx-auto h-8 w-8 text-[#8b7560]" />
            <h2 className="mt-5 font-display text-3xl text-[#201d19]">No owner activity yet.</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6e665d]">
              New venue-owner registrations and menu-management changes will appear here after they are completed.
            </p>
          </section>
        ) : (
          <section className="mt-8 overflow-hidden rounded-[2rem] border border-[#e4ddd2] bg-[#fbf9f5]">
            <div className="border-b border-[#e4ddd2] px-6 py-5 sm:px-7">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#8b7560]">
                Most recent actions
              </p>
            </div>
            <div className="divide-y divide-[#e9e1d7]">
              {activity.data.map(event => (
                <article key={event.id} className="grid gap-3 px-6 py-5 sm:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)_auto] sm:items-center sm:px-7">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#201d19]">{event.summary}</p>
                    <p className="mt-1 truncate text-sm text-[#6e665d]">
                      {event.ownerName || "Venue owner"}{event.ownerEmail ? ` · ${event.ownerEmail}` : ""}
                    </p>
                  </div>
                  <div className="min-w-0">
                    <span className="inline-flex rounded-full bg-[#e7d9c8] px-2.5 py-1 text-[11px] font-semibold tracking-[0.08em] text-[#433b34]">
                      {event.eventType.replaceAll("_", " ")}
                    </span>
                    <p className="mt-2 truncate text-sm text-[#6e665d]">{event.restaurantName || "Account-level activity"}</p>
                  </div>
                  <time className="text-xs leading-5 text-[#837867] sm:text-right" dateTime={new Date(event.createdAt).toISOString()}>
                    {formatTimestamp(event.createdAt)}
                  </time>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
