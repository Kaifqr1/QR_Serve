import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import {
  ArrowLeft,
  ArrowRight,
  LockKeyhole,
  Mail,
  UserPlus,
} from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function SignIn() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<"sign-in" | "register">("sign-in");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const me = trpc.auth.me.useQuery();

  useEffect(() => {
    if (me.data) setLocation("/app");
  }, [me.data, setLocation]);

  const signIn = trpc.auth.signIn.useMutation({
    onSuccess: user => {
      utils.auth.me.setData(undefined, user);
      toast.success("Welcome back to QRServe.");
      setLocation("/app");
    },
    onError: error =>
      toast.error(
        error.data?.code === "UNAUTHORIZED"
          ? "The email address or password is not valid."
          : error.message
      ),
  });

  const register = trpc.auth.register.useMutation({
    onSuccess: user => {
      utils.auth.me.setData(undefined, user);
      toast.success("Your venue-owner account is ready.");
      setLocation("/app");
    },
    onError: error => toast.error(error.message),
  });

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "register") register.mutate({ name, email, password });
    else signIn.mutate({ email, password });
  };

  return (
    <div className="grid min-h-screen bg-[#181716] text-[#f8f3ea] lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/10 p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <button
            onClick={() => setLocation("/")}
            className="flex items-center gap-3"
          >
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ed5739] text-sm font-bold">
              Q
            </span>
            <span className="font-display text-2xl">QRServe</span>
          </button>
          <p className="eyebrow mt-20 border-[#554c43] text-[#d8ccbb]">
            Local restaurant menu service
          </p>
          <h1 className="mt-5 max-w-md font-display text-6xl leading-[0.94] tracking-[-0.05em]">
            Your venue menu,
            <br />
            <em className="text-[#ed5739]">ready for service.</em>
          </h1>
          <p className="mt-6 max-w-sm leading-7 text-[#c9c1b5]">
            A private workspace for QRServe operators and approved venue owners
            to keep menus and table cards current.
          </p>
        </div>
        <p className="text-sm text-[#9f9486]">
          Private access for QRServe operators and approved venue owners.
        </p>
      </aside>
      <main className="grid place-items-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <button
            onClick={() => setLocation("/")}
            className="mb-10 inline-flex items-center gap-2 text-sm text-[#aa9f91] transition hover:text-white lg:hidden"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to QRServe
          </button>
          <div className="rounded-[2rem] border border-white/10 bg-[#211f1c] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-10">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ed5739]">
                {mode === "register" ? (
                  <UserPlus className="h-5 w-5" />
                ) : (
                  <LockKeyhole className="h-5 w-5" />
                )}
              </span>
              <p className="eyebrow border-[#554c43] text-[#d8ccbb]">
                {mode === "register"
                  ? "Approved venue owner"
                  : "QRServe workspace"}
              </p>
            </div>
            <h1 className="mt-7 font-display text-4xl tracking-[-0.04em]">
              {mode === "register"
                ? "Set up your venue access."
                : "Welcome back."}
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#bdb3a6]">
              {mode === "register"
                ? "Create an account to update only your own menu, venue details, and QR table cards."
                : "Sign in to prepare menus, update venue details, and print table cards."}
            </p>
            <form onSubmit={submit} className="mt-8 space-y-5">
              {mode === "register" && (
                <div>
                  <label className="label text-[#d8ccbb]" htmlFor="owner-name">
                    Your name
                  </label>
                  <Input
                    id="owner-name"
                    autoComplete="name"
                    value={name}
                    onChange={event => setName(event.target.value)}
                    required
                    minLength={2}
                    maxLength={80}
                    className="field h-10 border-[#554c43] bg-white/5 text-white placeholder:text-[#897e70]"
                    placeholder="Venue owner name"
                  />
                </div>
              )}
              <div>
                <label className="label text-[#d8ccbb]" htmlFor="auth-email">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-[#978b7d]" />
                  <Input
                    id="auth-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={event => setEmail(event.target.value)}
                    required
                    maxLength={320}
                    className="field h-10 border-[#554c43] bg-white/5 pl-10 text-white placeholder:text-[#897e70]"
                    placeholder={
                      mode === "register"
                        ? "owner@cafe.com"
                        : "your-email@example.com"
                    }
                  />
                </div>
                {mode === "register" && (
                  <p className="mt-2 text-xs text-[#938779]">
                    New venue-owner accounts accept only{" "}
                    <strong className="font-semibold text-[#d8ccbb]">
                      @rastaurant.com
                    </strong>{" "}
                    or{" "}
                    <strong className="font-semibold text-[#d8ccbb]">
                      @cafe.com
                    </strong>{" "}
                    email addresses.
                  </p>
                )}
              </div>
              <div>
                <label className="label text-[#d8ccbb]" htmlFor="auth-password">
                  Password
                </label>
                <Input
                  id="auth-password"
                  type="password"
                  autoComplete={
                    mode === "register" ? "new-password" : "current-password"
                  }
                  value={password}
                  onChange={event => setPassword(event.target.value)}
                  required
                  minLength={12}
                  maxLength={128}
                  className="field h-10 border-[#554c43] bg-white/5 text-white placeholder:text-[#897e70]"
                  placeholder="At least 12 characters"
                />
                <p className="mt-2 text-xs text-[#938779]">
                  {mode === "register"
                    ? "Your account can update only the venue menus you create."
                    : "Use your QRServe account credentials."}
                </p>
              </div>
              <Button
                type="submit"
                disabled={signIn.isPending || register.isPending}
                className="mt-2 h-12 w-full rounded-full bg-[#ed5739] text-white hover:bg-[#d94830]"
              >
                {signIn.isPending || register.isPending
                  ? "Please wait…"
                  : mode === "register"
                    ? "Create venue-owner account"
                    : "Sign in"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </form>
            <button
              type="button"
              onClick={() =>
                setMode(current =>
                  current === "sign-in" ? "register" : "sign-in"
                )
              }
              className="mt-6 w-full text-center text-sm font-semibold text-[#d8ccbb] underline decoration-[#ed5739] decoration-2 underline-offset-4 transition hover:text-white"
            >
              {mode === "sign-in"
                ? "Own a café or restaurant? Create venue-owner access"
                : "Already have an account? Sign in"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
