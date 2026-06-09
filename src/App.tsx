import React, { useLayoutEffect, useRef, useState } from "react"
import Field from "./components/Field.tsx"
import Logo from "./components/Logo.tsx"
import { useMask } from "@react-input/mask";

type Feedback = { type: "success" | "error" | ""; message: string };

// Fases del flujo (cada una se muestra como un slide horizontal)
const WELCOME = 0;
const FORM = 1;
const CONFIRM = 2;
const THANKS = 3;

// Servicios seleccionables. `image` es la foto en /public/services;
// `icon` (Bootstrap Icon) sirve de respaldo si la imagen no carga.
const SERVICES: { id: string; name: string; icon: string; image: string }[] = [
  { id: "spa-facial", name: "Spa facial", icon: "bi-flower1", image: "/services/spa-facial.jpg" },
  { id: "diseno-ceja", name: "Diseño de ceja", icon: "bi-eye", image: "/services/diseno-ceja.jpg" },
  { id: "limpieza-facial", name: "Limpieza facial", icon: "bi-droplet", image: "/services/limpieza-facial.jpg" },
  { id: "manicure", name: "Manicure", icon: "bi-hand-index", image: "/services/manicure.jpg" },
];

const MONTHS = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
const DAYS = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

const formatLongDate = (iso: string): string => {
  if (!iso) return "";
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DAYS[dt.getDay()]} ${d} de ${MONTHS[m - 1]}`;
};

const formatShortDate = (iso: string): string => {
  if (!iso) return "";
  const [, m, d] = iso.split("-").map(Number);
  return `${d} de ${MONTHS[m - 1]}`;
};

const formatTime = (t: string): string => {
  if (!t) return "";
  let [h, min] = t.split(":").map(Number);
  const ampm = h >= 12 ? "pm" : "am";
  h = h % 12 || 12;
  return `${h}:${String(min).padStart(2, "0")} ${ampm}`;
};

const inputClass =
  "w-full bg-transparent border-0 border-b border-sand rounded-none px-0 py-2.5 font-sans text-espresso text-base transition-all duration-300 cursor-pointer [color-scheme:light] focus:border-mocha focus:border-b-[1.5px] focus:outline-none";

const whitePill =
  "rounded-full bg-white px-10 py-3.5 font-sans text-base font-medium text-mocha transition-all duration-300 hover:bg-cream active:scale-[0.98] shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-mocha cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

const mochaPill =
  "rounded-full bg-mocha px-8 py-3.5 font-sans text-base font-medium text-white transition-all duration-300 hover:bg-clay hover:shadow-[0_8px_25px_-6px_rgba(159,122,102,0.5)] active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-mocha/50 focus-visible:ring-offset-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

function App() {
  const API_URL = import.meta.env.VITE_API_URL;

  // Navegación entre fases
  const [phase, setPhase] = useState<number>(WELCOME);

  // Estado de envío
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<Feedback>({ type: "", message: "" });

  // Datos del usuario
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [services, setServices] = useState<string[]>([]);
  const [date, setDate] = useState<string>("");
  const [time, setTime] = useState<string>("");

  // Máscara del input para el número de teléfono
  const phoneInputRef = useMask({ mask: "+___ ____ ____", replacement: { _: /\d/ } });

  // Altura animada del carrusel: se ajusta al slide activo
  const slideRefs = useRef<(HTMLElement | null)[]>([]);
  const [viewportHeight, setViewportHeight] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const el = slideRefs.current[phase];
    if (!el) return;
    // Altura fraccionaria exacta: evita el sub-píxel blanco entre slide y footer
    const update = (): void => setViewportHeight(el.getBoundingClientRect().height);
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [phase]);

  const goTo = (next: number): void => {
    setFeedback({ type: "", message: "" });
    setPhase(next);
  };

  const toggleService = (id: string): void => {
    setServices((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  };

  const selectedNames = SERVICES.filter((s) => services.includes(s.id)).map((s) => s.name).join(" & ");

  const handleContinue = (e: React.SubmitEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (services.length === 0) {
      setFeedback({ type: "error", message: "Selecciona al menos un servicio." });
      return;
    }
    if (!date || !time) {
      setFeedback({ type: "error", message: "Elige la fecha y la hora de tu cita." });
      return;
    }
    if (!name || !phone || !email) {
      setFeedback({ type: "error", message: "Completa tus datos para continuar." });
      return;
    }
    goTo(CONFIRM);
  };

  const handleConfirm = async (): Promise<void> => {
    setFeedback({ type: "", message: "" });
    setLoading(true);
    try {
      await fetch(API_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify({
          nombre: name,
          telefono: phone.replace(/\s+/g, ""),
          email: email,
          servicio: selectedNames,
          fecha: date,
          hora: time,
        }),
      });
      goTo(THANKS);
    } catch {
      setFeedback({ type: "error", message: "Error de conexión. Inténtalo de nuevo." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center p-4 sm:p-6 md:p-8">
      <article
        className="w-full max-w-[600px] bg-surface rounded-[1.75rem] shadow-[0_4px_6px_-1px_rgba(58,42,35,0.03),0_24px_60px_-16px_rgba(179,142,122,0.28)] overflow-hidden animate-fade-in"
        style={{ animationDelay: "0.1s" }}
      >
        {/* Carrusel de fases */}
        <div
          className="overflow-hidden transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{ height: viewportHeight }}
        >
          <div
            className="flex items-start transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]"
            style={{ transform: `translateX(-${phase * 100}%)` }}
          >
            {/* ── Fase 0: Bienvenida ── */}
            <section
              ref={(el) => { slideRefs.current[WELCOME] = el; }}
              aria-hidden={phase !== WELCOME}
              className="w-full shrink-0 bg-mocha px-8 py-14 sm:px-12 sm:py-20 flex flex-col items-center text-center"
            >
              <Logo tone="light" className="h-25 sm:h-28" />
              <h1 className="mt-12 font-display text-3xl sm:text-4xl font-bold text-white leading-snug text-balance">
                ¡Tu momento beauty empieza aquí!
              </h1>
              <p className="mt-3 font-sans font-light text-white/85 text-base sm:text-lg">
                Agenda tu cita en pocos pasos
              </p>
              <button type="button" onClick={() => goTo(FORM)} className={`mt-10 ${whitePill}`}>
                ¡Agenda ya!
              </button>
            </section>

            {/* ── Fase 1: Formulario ── */}
            <section
              ref={(el) => { slideRefs.current[FORM] = el; }}
              aria-hidden={phase !== FORM}
              className="w-full shrink-0 bg-surface px-7 py-10 sm:px-12 sm:py-12"
            >
              <div className="flex justify-center">
                <Logo tone="dark" className="h-25 sm:h-28" />
              </div>

              <form className="mt-10" onSubmit={handleContinue}>
                <fieldset className="border-0 p-0 m-0 space-y-9" disabled={loading}>
                  {/* Paso 1 — Servicios */}
                  <div>
                    <Step n={1} title="Selecciona el/los servicio/s" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {SERVICES.map((s, i) => (
                        <ServiceTile
                          key={s.id}
                          service={s}
                          active={services.includes(s.id)}
                          gradient={
                            i % 2 === 0
                              ? "linear-gradient(135deg,#f1e8e1,#dcc7ba)"
                              : "linear-gradient(135deg,#ecdbd0,#cbad9b)"
                          }
                          onToggle={() => toggleService(s.id)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Paso 2 — Fecha y hora */}
                  <div>
                    <Step n={2} title="Elige fecha y hora" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                      <div className="flex flex-col gap-1.5">
                        <label className="font-sans text-xs font-medium uppercase tracking-[0.15em] text-black">Fecha</label>
                        <input value={date} onChange={(e) => setDate(e.target.value)} type="date" className={inputClass} />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="font-sans text-xs font-medium uppercase tracking-[0.15em] text-black">Hora</label>
                        <input value={time} onChange={(e) => setTime(e.target.value)} type="time" className={inputClass} />
                      </div>
                    </div>
                  </div>

                  {/* Paso 3 — Datos */}
                  <div>
                    <Step n={3} title="Completa tus datos" />
                    <div className="space-y-6">
                      <Field label="Nombre y apellido" type="text" placeholder="Tu nombre completo" handler={setName} value={name} />
                      <Field label="Teléfono" type="tel" placeholder="+503 6900 0000" mask={phoneInputRef} handler={setPhone} value={phone} />
                      <Field label="Correo" type="email" placeholder="correo@ejemplo.com" handler={setEmail} value={email} />
                    </div>
                  </div>
                </fieldset>

                {feedback.message && phase === FORM && (
                  <p className="mt-6 font-sans text-sm text-red-600">{feedback.message}</p>
                )}

                <div className="mt-9 flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => goTo(WELCOME)}
                    className="font-sans text-sm text-taupe hover:text-mocha transition-colors duration-200 cursor-pointer inline-flex items-center gap-1.5"
                  >
                    <i className="bi bi-arrow-left" /> Volver
                  </button>
                  <button type="submit" className={mochaPill}>Continuar</button>
                </div>
              </form>
            </section>

            {/* ── Fase 2: Confirmación ── */}
            <section
              ref={(el) => { slideRefs.current[CONFIRM] = el; }}
              aria-hidden={phase !== CONFIRM}
              className="w-full shrink-0 bg-surface px-7 py-10 sm:px-12 sm:py-12"
            >
              <div className="flex justify-center">
                <Logo tone="dark" className="h-25 sm:h-28" />
              </div>

              <div className="mt-8 text-center">
                <h2 className="font-display text-2xl sm:text-3xl font-bold text-mocha">¡Confirmación de tu cita!</h2>
                <p className="mt-1 font-sans font-light text-taupe">Ya casi terminas</p>
              </div>

              <div className="mt-8 rounded-3xl bg-mocha text-white p-6 sm:p-8 space-y-6">
                <div>
                  <h3 className="font-display text-xl font-semibold">Servicio/s:</h3>
                  <p className="mt-1 font-sans font-light text-white/90">{selectedNames || "—"}</p>
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold">Fecha &amp; hora:</h3>
                  <p className="mt-1 font-sans font-light text-white/90">
                    {date && time ? `${formatLongDate(date)} a las ${formatTime(time)}` : "—"}
                  </p>
                </div>
                <div>
                  <h3 className="font-display text-xl font-semibold">Datos:</h3>
                  <p className="mt-1 font-sans font-light text-white/90 leading-relaxed">
                    {name}
                    <br />
                    {phone}
                    <br />
                    {email}
                  </p>
                </div>

                {feedback.message && phase === CONFIRM && (
                  <p className="font-sans text-sm text-white bg-red-500/30 rounded-lg px-3 py-2">{feedback.message}</p>
                )}

                <div className="pt-2 flex justify-center">
                  <button type="button" onClick={handleConfirm} disabled={loading} className={whitePill}>
                    {loading ? "Enviando..." : "¡Confirmar!"}
                  </button>
                </div>
              </div>

              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => goTo(FORM)}
                  className="font-sans text-sm text-taupe hover:text-mocha transition-colors duration-200 cursor-pointer inline-flex items-center gap-1.5"
                >
                  <i className="bi bi-arrow-left" /> Editar mis datos
                </button>
              </div>
            </section>

            {/* ── Fase 3: Gracias ── */}
            <section
              ref={(el) => { slideRefs.current[THANKS] = el; }}
              aria-hidden={phase !== THANKS}
              className="w-full shrink-0 bg-mocha px-8 py-14 sm:px-12 sm:py-20 flex flex-col items-center text-center"
            >
              <Logo tone="light" className="h-24 sm:h-28" />
              <h2 className="mt-12 font-display text-3xl sm:text-4xl font-bold text-white leading-snug">
                ¡Muchas gracias por tu cita!
              </h2>
              <p className="mt-3 font-sans font-light text-white/85 text-base sm:text-lg">
                Te esperamos el día:
                <br />
                {date && time ? `${formatShortDate(date)} a las ${formatTime(time)}` : ""}
              </p>
              <button
                type="button"
                onClick={() => window.open("https://maps.google.com/?q=Lum%C3%A9a+Beauty", "_blank", "noopener")}
                className={`mt-10 ${whitePill} inline-flex items-center gap-2`}
              >
                <i className="bi bi-geo-alt" /> Ubicación
              </button>
            </section>
          </div>
        </div>

        {/* Footer fijo (-mt-px cubre cualquier sub-píxel residual sobre fondos mocha) */}
        <footer className="relative -mt-px flex items-center justify-between gap-4 bg-clay px-6 sm:px-10 py-4 font-sans text-sm text-white/90">
          <span className="inline-flex items-center gap-2">
            <i className="bi bi-whatsapp text-base" /> 0000-0000
          </span>
          <span className="inline-flex items-center gap-2">
            <i className="bi bi-instagram text-base" /> @lumeasv
          </span>
        </footer>
      </article>
    </main>
  );
}

function ServiceTile({
  service,
  active,
  gradient,
  onToggle,
}: {
  service: { id: string; name: string; icon: string; image: string };
  active: boolean;
  gradient: string;
  onToggle: () => void;
}) {
  const [imgOk, setImgOk] = useState(true);
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={active}
      className="group flex flex-col items-center gap-2 focus:outline-none cursor-pointer"
    >
      <span
        className={`relative w-full aspect-square overflow-hidden rounded-2xl grid place-items-center transition-all duration-300 ${
          active
            ? "ring-2 ring-mocha shadow-[0_10px_22px_-10px_rgba(159,122,102,0.55)]"
            : "ring-1 ring-sand group-hover:ring-mocha/40"
        }`}
        style={{ backgroundImage: gradient }}
      >
        {/* Respaldo: icono visible si la foto no carga */}
        <i className={`bi ${service.icon} text-2xl ${active ? "text-clay" : "text-mocha/70"}`} />

        {imgOk && (
          <img
            src={service.image}
            alt={service.name}
            loading="lazy"
            onError={() => setImgOk(false)}
            className={`absolute inset-0 h-full w-full object-cover transition-transform duration-500 ${
              active ? "scale-105" : "group-hover:scale-105"
            }`}
          />
        )}

        {active && <span className="absolute inset-0 bg-mocha/25" />}

        {active && (
          <span className="absolute top-1.5 right-1.5 z-10 grid place-items-center h-5 w-5 rounded-full bg-mocha text-white ring-2 ring-white/70">
            <i className="bi bi-check-lg text-xs" />
          </span>
        )}
      </span>
      <span className={`font-sans text-xs text-center ${active ? "text-espresso font-medium" : "text-taupe"}`}>
        {service.name}
      </span>
    </button>
  );
}

function Step({ n, title }: { n: number; title: string }) {
  return (
    <div className="mb-4">
      <h3 className="font-display text-lg sm:text-xl font-semibold text-mocha">Paso {n}</h3>
      <p className="mt-0.5 font-sans text-sm sm:text-base text-espresso">{title}</p>
    </div>
  );
}

export default App
