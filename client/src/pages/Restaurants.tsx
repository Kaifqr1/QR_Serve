import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import {
  MapPin,
  Pencil,
  Plus,
  QrCode,
  ShieldCheck,
  Trash2,
  UserRound,
  UtensilsCrossed,
} from "lucide-react";
import { FormEvent, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function Restaurants() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [location, setLocationText] = useState("");
  const [description, setDescription] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const ownRestaurants = trpc.restaurant.list.useQuery();
  const administratorRestaurants = trpc.restaurant.adminList.useQuery(undefined, {
    enabled: isAdmin,
  });
  const utils = trpc.useUtils();
  const [, setLocation] = useLocation();

  const venues = useMemo(
    () =>
      isAdmin
        ? (administratorRestaurants.data ?? []).map(venue => ({
            ...venue,
            ownerName: venue.ownerName || "Venue owner",
            ownerEmail: venue.ownerEmail || null,
          }))
        : (ownRestaurants.data ?? []).map(venue => ({
            ...venue,
            ownerName: user?.name || "Your account",
            ownerEmail: user?.email || null,
          })),
    [administratorRestaurants.data, isAdmin, ownRestaurants.data, user?.email, user?.name]
  );

  const isLoading = isAdmin
    ? administratorRestaurants.isLoading
    : ownRestaurants.isLoading;

  const refreshVenueLists = () => {
    utils.restaurant.list.invalidate();
    utils.restaurant.adminList.invalidate();
  };

  const create = trpc.restaurant.create.useMutation({
    onSuccess: restaurant => {
      refreshVenueLists();
      toast.success("Client venue created. Let’s prepare its menu.");
      setLocation(`/app/menu/${restaurant.id}`);
    },
    onError: error => toast.error(error.message),
  });
  const update = trpc.restaurant.update.useMutation({
    onSuccess: () => {
      refreshVenueLists();
      resetForm();
      toast.success("Client venue details saved.");
    },
    onError: error => toast.error(error.message),
  });
  const remove = trpc.restaurant.delete.useMutation({
    onSuccess: () => {
      refreshVenueLists();
      toast.success("Client venue removed.");
    },
    onError: error => toast.error(error.message),
  });

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setName("");
    setLocationText("");
    setDescription("");
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (editingId) update.mutate({ id: editingId, name, location, description });
    else create.mutate({ name, location, description });
  };

  return (
    <DashboardLayout>
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow text-[#8b7560]">
              {isAdmin ? "Administrator client venues" : "Client venues"}
            </p>
            <h1 className="mt-3 font-display text-4xl tracking-[-0.045em] text-[#201d19] sm:text-5xl">
              {isAdmin
                ? "Every client venue, in one place."
                : "The places you set up and support."}
            </h1>
            {isAdmin && (
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[#6e665d] sm:text-base">
                View administrator and venue-owner client venues together. Owner-managed venues remain editable only by their registered owner.
              </p>
            )}
          </div>
          <Button
            onClick={() => setShowForm(value => !value)}
            className="rounded-full bg-[#ed5739] text-white hover:bg-[#d94830]"
          >
            <Plus className="mr-2 h-4 w-4" /> Add client venue
          </Button>
        </div>

        {showForm && (
          <form
            onSubmit={submit}
            className="mt-8 grid gap-4 rounded-[1.75rem] border border-[#ded4c7] bg-[#fbf9f5] p-6 sm:grid-cols-2 sm:p-8"
          >
            <div className="sm:col-span-2">
              <label className="label" htmlFor="restaurant-name">Venue name</label>
              <Input
                id="restaurant-name"
                value={name}
                onChange={event => setName(event.target.value)}
                required
                minLength={2}
                placeholder="e.g. Jamun Kitchen"
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="restaurant-location">Location</label>
              <Input
                id="restaurant-location"
                value={location}
                onChange={event => setLocationText(event.target.value)}
                required
                minLength={2}
                placeholder="e.g. Bandra West, Mumbai"
                className="field"
              />
            </div>
            <div>
              <label className="label" htmlFor="restaurant-timezone">Menu timezone</label>
              <Input id="restaurant-timezone" defaultValue="Asia/Kolkata" disabled className="field opacity-70" />
            </div>
            <div className="sm:col-span-2">
              <label className="label" htmlFor="restaurant-description">Public venue description</label>
              <Textarea
                id="restaurant-description"
                value={description}
                onChange={event => setDescription(event.target.value)}
                placeholder="A short description that guests will see after scanning."
                className="field min-h-24"
              />
            </div>
            <div className="flex gap-3 sm:col-span-2">
              <Button
                type="submit"
                disabled={create.isPending || update.isPending}
                className="rounded-full bg-[#201d19] text-white hover:bg-[#3a342e]"
              >
                {create.isPending || update.isPending
                  ? "Saving…"
                  : editingId
                    ? "Save changes"
                    : "Create client venue"}
              </Button>
              <Button type="button" variant="ghost" onClick={resetForm} className="rounded-full">Cancel</Button>
            </div>
          </form>
        )}

        <div className="mt-8 grid gap-5 lg:grid-cols-2">
          {isLoading
            ? Array.from({ length: 2 }).map((_, index) => (
                <div key={index} className="h-64 animate-pulse rounded-3xl bg-[#e6dfd6]" />
              ))
            : venues.map(venue => {
                const isOwnVenue = venue.ownerId === user?.id;
                return (
                  <article
                    key={venue.id}
                    className="rounded-3xl border border-[#e4ddd2] bg-[#fbf9f5] p-6 sm:p-7"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="eyebrow text-[#8b7560]">
                          {isAdmin && !isOwnVenue ? "Venue owner account" : "QRServe managed venue"}
                        </p>
                        <h2 className="mt-3 truncate font-display text-3xl text-[#201d19]">{venue.name}</h2>
                        <p className="mt-2 flex items-center gap-2 text-sm text-[#70675d]">
                          <MapPin className="h-4 w-4 shrink-0 text-[#ed5739]" />{venue.location}
                        </p>
                      </div>
                      {isOwnVenue && (
                        <button
                          onClick={() => {
                            if (confirm(`Remove ${venue.name}? This also removes its menu and analytics.`)) {
                              remove.mutate({ id: venue.id });
                            }
                          }}
                          aria-label={`Remove ${venue.name}`}
                          className="rounded-xl p-2 text-[#9a8d7c] transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="mt-5 flex items-center gap-2 rounded-2xl bg-[#f1e8dc] px-3 py-2.5 text-sm text-[#5e554b]">
                        <UserRound className="h-4 w-4 shrink-0 text-[#8b7560]" />
                        <span className="min-w-0 truncate">
                          <strong className="font-semibold text-[#3b342d]">{venue.ownerName}</strong>
                          {venue.ownerEmail ? ` · ${venue.ownerEmail}` : ""}
                        </span>
                      </div>
                    )}

                    <p className="mt-5 min-h-12 text-sm leading-6 text-[#70675d]">
                      {venue.description || "No public description yet. Add one before the table card is printed."}
                    </p>

                    {isOwnVenue ? (
                      <div className="mt-6 flex flex-wrap gap-2">
                        <Button
                          onClick={() => setLocation(`/app/menu/${venue.id}`)}
                          className="rounded-full bg-[#201d19] text-white hover:bg-[#3a342e]"
                        >
                          <UtensilsCrossed className="mr-2 h-4 w-4" /> Prepare menu
                        </Button>
                        <Button
                          onClick={() => setLocation(`/app/qr/${venue.id}`)}
                          variant="outline"
                          className="rounded-full border-[#d8cfc3] bg-transparent"
                        >
                          <QrCode className="mr-2 h-4 w-4" /> Table cards
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingId(venue.id);
                            setName(venue.name);
                            setLocationText(venue.location);
                            setDescription(venue.description || "");
                            setShowForm(true);
                          }}
                          variant="ghost"
                          className="rounded-full"
                        >
                          <Pencil className="mr-2 h-4 w-4" /> Edit venue
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-6 flex items-center justify-between gap-3 rounded-2xl border border-[#e4ddd2] bg-white/70 px-4 py-3">
                        <p className="text-xs leading-5 text-[#70675d]">
                          Owner-managed venue. Its menu and details remain private to its registered owner.
                        </p>
                        <Button
                          onClick={() => setLocation("/app/activity")}
                          variant="ghost"
                          className="shrink-0 rounded-full text-[#3b342d]"
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" /> Activity
                        </Button>
                      </div>
                    )}
                  </article>
                );
              })}
        </div>

        {!isLoading && venues.length === 0 && (
          <section className="mt-8 rounded-[2rem] border border-dashed border-[#cfc4b5] bg-[#fbf9f5] p-8 text-center sm:p-12">
            <h2 className="font-display text-3xl text-[#201d19]">
              {isAdmin ? "No client venues yet." : "No client venues in your workspace yet."}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-[#6e665d]">
              {isAdmin
                ? "Venues created by QRServe operators and approved venue owners will appear here."
                : "Set up your first venue to prepare its menu and table QR card."}
            </p>
          </section>
        )}
      </div>
    </DashboardLayout>
  );
}
