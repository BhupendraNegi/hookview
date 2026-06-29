import { CreateInboxButton } from "@/components/CreateInboxButton";
import { LiveDot } from "@/components/LiveDot";
import { MethodBadge } from "@/components/MethodBadge";
import {
  LayersIcon,
  EyeIcon,
  CursorClickIcon,
  PlugIcon,
  ActivityIcon,
  ArrowRightIcon,
} from "@/components/icons";

const GRAD = "linear-gradient(135deg,#9d7bff,#6a45f0)";

function LogoTile({ size }: { size: number }) {
  return (
    <span
      className="inline-grid shrink-0 place-items-center text-white shadow-tile"
      style={{ width: size, height: size, borderRadius: size * 0.29, background: GRAD }}
    >
      <LayersIcon style={{ width: size * 0.5, height: size * 0.5 }} strokeWidth={2.1} />
    </span>
  );
}

const STEPS = [
  {
    n: 1,
    Icon: CursorClickIcon,
    title: "Create your inbox",
    body: "Click once and get a unique webhook URL — no account, nothing to install.",
  },
  {
    n: 2,
    Icon: PlugIcon,
    title: "Point your service at it",
    body: "Paste the URL into Stripe, GitHub, Shopify — any service's webhook settings.",
  },
  {
    n: 3,
    Icon: ActivityIcon,
    title: "Watch requests land live",
    body: "Every request streams in instantly. Inspect headers, query params and pretty JSON.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-app text-ink">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex flex-col items-center justify-center overflow-hidden px-6 text-center" style={{ minHeight: "94vh" }}>
        {/* soft floating blobs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-40 -top-40 h-[460px] w-[460px] animate-floaty-slow rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(124,92,255,.30), transparent 70%)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-40 -right-40 h-[420px] w-[420px] animate-floaty-fast rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,107,94,.22), transparent 70%)" }}
        />

        <div className="relative mx-auto flex max-w-[940px] flex-col items-center">
          {/* eyebrow */}
          <span className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-border2 bg-white px-4 py-2 text-[12px] font-bold uppercase tracking-[.06em] text-ink2 shadow-card">
            <LiveDot size={8} />
            Free · No signup · Real-time
          </span>

          {/* brand */}
          <div className="mb-6 flex items-center gap-4">
            <LogoTile size={52} />
            <span className="text-[44px] font-extrabold tracking-[-.025em]">HookView</span>
          </div>

          {/* headline */}
          <h1
            className="max-w-[760px] text-balance text-[40px] font-extrabold tracking-[-.03em]"
            style={{ lineHeight: 1.12 }}
          >
            See exactly what your webhooks are sending —{" "}
            <span className="text-primary">in real time.</span>
          </h1>

          {/* paragraph */}
          <p className="mt-6 max-w-[580px] text-[18px] leading-[1.6] text-ink2">
            Apps like Stripe and GitHub send tiny messages — called{" "}
            <strong className="font-semibold text-mono2">webhooks</strong> — to your app
            whenever something happens: a payment, a new order, a code push. HookView gives you
            a free web address that catches every one, so you can open it up and see precisely
            what&apos;s inside.
          </p>

          {/* analogy pill */}
          <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-primary-tintborder bg-primary-tint px-4 py-2 text-[13.5px] font-medium text-primary-end">
            <EyeIcon className="h-4 w-4" />
            In plain words: see the messages your apps send each other — the moment they happen.
          </span>

          {/* CTA */}
          <div className="mt-9">
            <CreateInboxButton label="Create my free inbox" />
          </div>
          <p className="mt-4 text-[13px] text-muted">
            You&apos;ll get your own URL in one click — no signup, nothing to install.
          </p>

          {/* concept visual */}
          <div className="mt-14 flex flex-wrap items-center justify-center gap-5">
            <div className="rounded-card border border-border2 bg-white p-5 text-left shadow-card">
              <div className="mb-2 text-[11px] font-bold uppercase tracking-[.08em] text-muted">
                Your URL
              </div>
              <code className="font-mono text-[14px] font-medium text-mono">
                hooks.hookview.dev/in_4f9c2a
              </code>
            </div>
            <ArrowRightIcon className="h-6 w-6 text-primary-tintborder" />
            <div className="w-[280px] rounded-card border border-border2 bg-white p-3 text-left shadow-card">
              {[
                { m: "POST", t: "charge.succeeded", s: "2s" },
                { m: "POST", t: "push · main", s: "14s" },
                { m: "GET", t: "health check", s: "1m" },
              ].map((r) => (
                <div key={r.t} className="flex items-center gap-2.5 rounded-item px-2 py-2">
                  <MethodBadge method={r.m} />
                  <span className="flex-1 truncate text-[13px] font-bold">{r.t}</span>
                  <span className="text-[12px] font-semibold text-muted">{r.s}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="border-t border-[#efedf6] bg-white px-6 pb-[104px] pt-[78px]">
        <div className="mx-auto max-w-[1060px]">
          <div className="flex flex-col items-center text-center">
            <span className="mb-5 inline-flex items-center rounded-full border border-primary-tintborder bg-primary-tint px-3.5 py-1.5 text-[12px] font-bold uppercase tracking-[.06em] text-primary-end">
              How it works
            </span>
            <h2 className="text-[33px] font-extrabold tracking-[-.025em]">Three steps, zero setup</h2>
            <p className="mt-3 max-w-[560px] text-[16px] leading-[1.6] text-ink2">
              No accounts, no SDKs, no config files. Just a URL and a live view of everything that
              hits it.
            </p>
          </div>

          {/* step cards */}
          <div className="mt-12 flex flex-wrap justify-center gap-5">
            {STEPS.map(({ n, Icon, title, body }) => (
              <div
                key={n}
                className="relative flex min-w-[250px] max-w-[320px] flex-1 flex-col rounded-panel border border-border3 bg-subtle p-6"
              >
                <Icon className="absolute right-5 top-5 h-7 w-7 text-primary-tintborder" />
                <span
                  className="mb-4 inline-grid h-10 w-10 place-items-center rounded-xl text-[16px] font-extrabold text-white shadow-tile"
                  style={{ background: GRAD }}
                >
                  {n}
                </span>
                <h3 className="text-[17px] font-bold">{title}</h3>
                <p className="mt-2 text-[14px] leading-[1.55] text-ink2">{body}</p>
              </div>
            ))}
          </div>

          {/* flow diagram */}
          <div
            className="mt-10 rounded-feature px-8 py-10"
            style={{ background: "linear-gradient(180deg,#faf9ff,#f4f2fc)", border: "1px solid #eceaf6" }}
          >
            <div className="mb-8 text-center text-[12px] font-bold uppercase tracking-[.08em] text-muted">
              The flow of a single webhook
            </div>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <FlowNode title="Your service" sub="Stripe · GitHub · Shopify" />
              <FlowArrow top="fires an event" bottom="POST /in_4f9c2a" />
              <FlowNode title="HookView catches it" sub="hooks.hookview.dev" purple />
              <FlowArrow top="streams live" bottom="no refresh" />
              <FlowNode title="Your dashboard" sub="POST charge.succeeded" />
            </div>
          </div>

          <div className="mt-12 flex justify-center">
            <CreateInboxButton label="Create my free inbox" />
          </div>
        </div>
      </section>
    </main>
  );
}

function FlowNode({ title, sub, purple }: { title: string; sub: string; purple?: boolean }) {
  return (
    <div
      className="grid h-[100px] w-[178px] place-content-center rounded-panel px-4 text-center shadow-card"
      style={
        purple
          ? { background: GRAD, color: "#fff" }
          : { background: "#fff", border: "1px solid #eceaf6" }
      }
    >
      <div className="text-[14px] font-bold">{title}</div>
      <div
        className={"mt-1 font-mono text-[11px] " + (purple ? "text-white/80" : "text-muted")}
      >
        {sub}
      </div>
    </div>
  );
}

function FlowArrow({ top, bottom }: { top: string; bottom: string }) {
  return (
    <div className="flex w-[86px] flex-col items-center gap-1 text-center">
      <span className="text-[11px] font-semibold text-ink2">{top}</span>
      <span className="text-primary-tintborder">→ → →</span>
      <span className="font-mono text-[10.5px] text-muted">{bottom}</span>
    </div>
  );
}
