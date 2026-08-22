import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowRight, LockKeyhole, Mail, UserRound } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type AuthMode = "signIn" | "register" | "recover";

const credentialFailureMessage = "We couldn't sign you in with those details. If this is your first visit after the update, create an account or recover your previous workspace below.";

export default function SignIn() {
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [mode, setMode] = useState<AuthMode>("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const me = trpc.auth.me.useQuery();

  useEffect(() => {
    if (me.data) setLocation("/app");
  }, [me.data, setLocation]);

  const complete = (user: unknown, message: string) => {
    utils.auth.me.setData(undefined, user as never);
    toast.success(message);
    setLocation("/app");
  };

  const signIn = trpc.auth.signIn.useMutation({
    onSuccess: user => complete(user, "Welcome back to QRServe."),
    onError: error => toast.error(error.data?.code === "UNAUTHORIZED" ? credentialFailureMessage : error.message),
  });
  const register = trpc.auth.register.useMutation({
    onSuccess: user => complete(user, "Your QRServe workspace is ready."),
    onError: error => toast.error(error.message),
  });
  const claimLegacy = trpc.auth.claimLegacy.useMutation({
    onSuccess: user => complete(user, "Your previous QRServe workspace is ready."),
    onError: error => toast.error(error.message),
  });
  const pending = signIn.isPending || register.isPending || claimLegacy.isPending;
  const needsName = mode !== "signIn";

  const chooseMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setPassword("");
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === "register") register.mutate({ name, email, password });
    else if (mode === "recover") claimLegacy.mutate({ name, email, password });
    else signIn.mutate({ email, password });
  };

  const heading = mode === "signIn" ? "Welcome back." : mode === "recover" ? "Recover your workspace." : "Create your workspace.";
  const description = mode === "signIn"
    ? "Sign in to edit your restaurant menus and QR destinations."
    : mode === "recover"
      ? "Use this only in the browser where you used QRServe before the email/password update. If this email already has a QRServe account, enter that account’s current password to merge the previous workspace safely."
      : "Set up a secure account to begin publishing your restaurant menu.";

  return (
    <div className="grid min-h-screen bg-[#181716] text-[#f8f3ea] lg:grid-cols-[0.9fr_1.1fr]">
      <aside className="relative hidden overflow-hidden border-r border-white/10 p-10 lg:flex lg:flex-col lg:justify-between">
        <div>
          <button onClick={() => setLocation("/")} className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-2xl bg-[#ed5739] text-sm font-bold">Q</span><span className="font-display text-2xl">QRServe</span></button>
          <p className="eyebrow mt-20 border-[#554c43] text-[#d8ccbb]">Independent restaurant tools</p>
          <h1 className="mt-5 max-w-md font-display text-6xl leading-[0.94] tracking-[-0.05em]">Your menu,<br /><em className="text-[#ed5739]">in service.</em></h1>
          <p className="mt-6 max-w-sm leading-7 text-[#c9c1b5]">A focused workspace for menus that stay current from the kitchen to every table.</p>
        </div>
        <p className="text-sm text-[#9f9486]">Private account access for restaurant teams.</p>
      </aside>
      <main className="grid place-items-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-md">
          <button onClick={() => setLocation("/")} className="mb-10 inline-flex items-center gap-2 text-sm text-[#aa9f91] transition hover:text-white lg:hidden"><ArrowLeft className="h-4 w-4" />Back to QRServe</button>
          <div className="rounded-[2rem] border border-white/10 bg-[#211f1c] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.25)] sm:p-10">
            <div className="flex items-center gap-3"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-[#ed5739]"><LockKeyhole className="h-5 w-5" /></span><p className="eyebrow border-[#554c43] text-[#d8ccbb]">QRServe account</p></div>
            <h2 className="mt-7 font-display text-4xl tracking-[-0.04em]">{heading}</h2>
            <p className="mt-3 text-sm leading-6 text-[#bdb3a6]">{description}</p>
            <form onSubmit={submit} className="mt-8 space-y-5">
              {needsName && <div><label className="label text-[#d8ccbb]" htmlFor="auth-name">Your name</label><div className="relative"><UserRound className="absolute left-3 top-3 h-4 w-4 text-[#978b7d]" /><Input id="auth-name" autoComplete="name" value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={80} className="field h-10 border-[#554c43] bg-white/5 pl-10 text-white placeholder:text-[#897e70]" placeholder="Restaurant owner" /></div></div>}
              <div><label className="label text-[#d8ccbb]" htmlFor="auth-email">Email address</label><div className="relative"><Mail className="absolute left-3 top-3 h-4 w-4 text-[#978b7d]" /><Input id="auth-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} required maxLength={320} className="field h-10 border-[#554c43] bg-white/5 pl-10 text-white placeholder:text-[#897e70]" placeholder="you@example.com" /></div></div>
              <div><label className="label text-[#d8ccbb]" htmlFor="auth-password">Password</label><Input id="auth-password" type="password" autoComplete={mode === "signIn" ? "current-password" : "new-password"} value={password} onChange={event => setPassword(event.target.value)} required minLength={12} maxLength={128} className="field h-10 border-[#554c43] bg-white/5 text-white placeholder:text-[#897e70]" placeholder={mode === "signIn" ? "Your password" : "At least 12 characters"} /><p className="mt-2 text-xs text-[#938779]">Use at least 12 characters.</p></div>
              <Button type="submit" disabled={pending} className="mt-2 h-12 w-full rounded-full bg-[#ed5739] text-white hover:bg-[#d94830]">{pending ? "Please wait…" : mode === "signIn" ? "Sign in" : mode === "recover" ? "Recover workspace" : "Create account"}<ArrowRight className="ml-2 h-4 w-4" /></Button>
            </form>
            {mode === "signIn" ? <div className="mt-7 space-y-3 text-center text-sm text-[#b7ada1]"><p>New to QRServe?<button onClick={() => chooseMode("register")} className="ml-2 font-semibold text-[#f77a61] hover:text-[#ff9b86]">Create an account</button></p><button onClick={() => chooseMode("recover")} className="font-semibold text-[#f77a61] hover:text-[#ff9b86]">Recover a previous QRServe workspace</button></div> : <div className="mt-7 space-y-3 text-center text-sm text-[#b7ada1]"><p>{mode === "recover" ? "Need a fresh account?" : "Already have an account?"}<button onClick={() => chooseMode(mode === "recover" ? "register" : "signIn")} className="ml-2 font-semibold text-[#f77a61] hover:text-[#ff9b86]">{mode === "recover" ? "Create an account" : "Sign in"}</button></p>{mode === "recover" && <button onClick={() => chooseMode("signIn")} className="font-semibold text-[#f77a61] hover:text-[#ff9b86]">Back to sign in</button>}</div>}
          </div>
        </div>
      </main>
    </div>
  );
}
