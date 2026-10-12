"use client";

import { useState } from "react";
import { collection, doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { TIPOS_EVENTO, ESTILOS, FUNCIONES, FUNCIONES_AYUDA, fichaVacia, llaveDetalle, waLink } from "../lib/campos";

const MI_WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP || "7776242702";

/* ---------- Componentes pequeños (fuera del principal para no perder el foco) ---------- */

function FondoAnimado() {
  return (
    <div className="bg" aria-hidden="true">
      <div className="blob b1" />
      <div className="blob b2" />
      <div className="blob b3" />
      <div className="brillos" />
    </div>
  );
}

// Campo con etiqueta y opción de "Agregar más detalles"
function Campo({ label, req, lleno, detalle, onDetalle, children }) {
  const [abierto, setAbierto] = useState(Boolean(detalle));
  return (
    <div className={`field ${lleno ? "lleno" : ""}`}>
      <label>
        {label} {req && <span className="req">*</span>}
      </label>
      {children}
      {onDetalle && (
        <>
          <button type="button" className={`mas ${abierto ? "abierto" : ""}`} onClick={() => setAbierto(!abierto)}>
            <span className="signo">+</span> {abierto ? "Ocultar detalles" : "Agregar más detalles"}
          </button>
          {abierto && (
            <div className="mas-caja">
              <textarea
                placeholder="Escribe aquí cualquier detalle extra que debamos saber…"
                value={detalle}
                onChange={(e) => onDetalle(e.target.value)}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Chips({ opciones, valor, onChange }) {
  return (
    <div className="chips">
      {opciones.map((o) => (
        <button type="button" key={o} className={`chip ${valor === o ? "on" : ""}`} onClick={() => onChange(valor === o ? "" : o)}>
          {o}
        </button>
      ))}
    </div>
  );
}

/* ---------- Página ---------- */

export default function Ficha() {
  const [f, setF] = useState(fichaVacia);
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState("");
  const [listo, setListo] = useState(null);

  // Actualiza un campo anidado: set("evento", "fecha", valor)
  const set = (seccion, campo, valor) => setF((p) => ({ ...p, [seccion]: { ...p[seccion], [campo]: valor } }));
  const setDetalle = (llave, valor) => setF((p) => ({ ...p, detalles: { ...p.detalles, [llave]: valor } }));

  // Props del input
  const inp = (seccion, campo) => ({
    value: f[seccion][campo],
    onChange: (e) => set(seccion, campo, e.target.value),
  });
  // Props del contenedor (estado "lleno" + detalles extra)
  const c = (seccion, campo, conDetalle = true) => {
    const llave = llaveDetalle(seccion, campo);
    return {
      lleno: Boolean(f[seccion][campo]),
      ...(conDetalle && { detalle: f.detalles[llave] || "", onDetalle: (v) => setDetalle(llave, v) }),
    };
  };

  const toggleFuncion = (fn) =>
    setF((p) => ({ ...p, funciones: p.funciones.includes(fn) ? p.funciones.filter((x) => x !== fn) : [...p.funciones, fn] }));

  const enviar = async (e) => {
    e.preventDefault();
    setError("");

    if (!f.contacto.nombre.trim()) return setError("Escribe tu nombre para saber de quién es la ficha.");
    if (f.contacto.whatsapp.replace(/\D/g, "").length < 10) return setError("Escribe tu WhatsApp a 10 dígitos.");
    if (!f.evento.tipo) return setError("Elige el tipo de evento.");
    if (!f.evento.fecha) return setError("Indica la fecha del evento.");

    // Quita detalles vacíos antes de guardar
    const detalles = Object.fromEntries(Object.entries(f.detalles).filter(([, v]) => v && v.trim()));

    setEnviando(true);
    try {
      const nuevaRef = doc(collection(db, "fichas"));
      await setDoc(nuevaRef, {
        ...f,
        detalles,
        estado: "nueva",
        creadoEn: serverTimestamp(),
      });
      setListo({ id: nuevaRef.id, nombre: f.contacto.nombre, tipo: f.evento.tipo });
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      console.error(err);
      setError("No se pudo enviar la ficha. Revisa tu conexión e inténtalo de nuevo.");
    } finally {
      setEnviando(false);
    }
  };

  if (listo) {
    const folio = listo.id.slice(0, 6).toUpperCase();
    const msg = `¡Hola! Soy ${listo.nombre}. Acabo de llenar la ficha de mi invitación (${listo.tipo}). Folio: ${folio}. Te envío mis fotos e imágenes de referencia:`;
    return (
      <main className="wrap">
        <FondoAnimado />
        <div className="hero">
          <p className="brand">MENDOZA INVITACIONES</p>
        </div>
        <div className="section done">
          <div className="icon">✓</div>
          <h2>¡Ficha recibida!</h2>
          <p>
            Gracias, {listo.nombre}. Con esta información prepararemos una propuesta acorde con el estilo de tu evento.
            <br />
            Tu folio es <strong>{folio}</strong>.
          </p>
          <p>
            <strong>Último paso:</strong> mándanos por WhatsApp tus fotografías e imágenes de referencia, junto con tu folio.
          </p>
          <a className="btn wa" href={waLink(MI_WHATSAPP, msg)} target="_blank" rel="noreferrer" style={{ marginTop: 12 }}>
            Enviar fotos por WhatsApp
          </a>
        </div>
      </main>
    );
  }

  const esCumple = ["XV años", "Cumpleaños"].includes(f.evento.tipo);

  return (
    <main className="wrap">
      <FondoAnimado />

      <header className="hero">
        <p className="brand">MENDOZA INVITACIONES</p>
        <h1>Ficha de personalización de invitación digital</h1>
        <p>Comparte la siguiente información para comenzar con el diseño de tu invitación. Si algún apartado no aplica a tu evento, puedes dejarlo en blanco.</p>
        <div className="ornament" />
      </header>

      <nav className="steps">
        <a href="#contacto">Tus datos</a>
        <a href="#evento">1. Evento</a>
        <a href="#diseno">2. Diseño</a>
        <a href="#funciones">3. Funciones</a>
        <a href="#confirmacion">4. Confirmación</a>
        <a href="#itinerario">5. Itinerario</a>
        <a href="#material">6. Material</a>
      </nav>

      <form onSubmit={enviar} noValidate>
        {/* Contacto */}
        <section className="section" id="contacto">
          <h2>Tus datos de contacto</h2>
          <p className="hint">Para enviarte la propuesta de tu invitación.</p>
          <div className="grid two">
            <Campo label="Tu nombre" req {...c("contacto", "nombre", false)}>
              <input type="text" autoComplete="name" {...inp("contacto", "nombre")} />
            </Campo>
            <Campo label="Tu WhatsApp" req {...c("contacto", "whatsapp", false)}>
              <input type="tel" inputMode="numeric" placeholder="10 dígitos" autoComplete="tel" {...inp("contacto", "whatsapp")} />
            </Campo>
          </div>
        </section>

        {/* 1. Evento */}
        <section className="section" id="evento">
          <h2><span className="num">1.</span>Datos del evento</h2>
          <div className="grid">
            <Campo label="Tipo de evento" req {...c("evento", "tipo")}>
              <Chips opciones={TIPOS_EVENTO} valor={f.evento.tipo} onChange={(v) => set("evento", "tipo", v)} />
            </Campo>
            <div className="grid two">
              <Campo label="Nombre del festejado(a)" {...c("evento", "festejado")}>
                <input type="text" {...inp("evento", "festejado")} />
              </Campo>
              <Campo label="Edad que cumple" {...c("evento", "edad")}>
                <input type="text" inputMode="numeric" placeholder={esCumple ? "Ej. 15" : "Si aplica"} {...inp("evento", "edad")} />
              </Campo>
            </div>
            <Campo label="Nombre de los novios o anfitriones" {...c("evento", "anfitriones")}>
              <input type="text" {...inp("evento", "anfitriones")} />
            </Campo>
            <div className="grid two">
              <Campo label="Fecha del evento" req {...c("evento", "fecha")}>
                <input type="date" {...inp("evento", "fecha")} />
              </Campo>
              <Campo label="Hora de inicio" {...c("evento", "hora")}>
                <input type="time" {...inp("evento", "hora")} />
              </Campo>
            </div>
            <Campo label="Nombre del lugar" {...c("evento", "lugar")}>
              <input type="text" {...inp("evento", "lugar")} />
            </Campo>
            <Campo label="Dirección del evento" {...c("evento", "direccion")}>
              <input type="text" {...inp("evento", "direccion")} />
            </Campo>
            <Campo label="Enlace de Google Maps" {...c("evento", "maps")}>
              <input type="url" placeholder="https://maps.app.goo.gl/…" {...inp("evento", "maps")} />
            </Campo>
            <Campo label="Código de vestimenta" {...c("evento", "vestimenta")}>
              <input type="text" placeholder="Ej. Formal, casual, coctel…" {...inp("evento", "vestimenta")} />
            </Campo>
          </div>
        </section>

        {/* 2. Diseño */}
        <section className="section" id="diseno">
          <h2><span className="num">2.</span>Diseño y temática</h2>
          <div className="grid">
            <Campo label="Estilo de invitación" {...c("diseno", "estilo")}>
              <Chips opciones={ESTILOS} valor={f.diseno.estilo} onChange={(v) => set("diseno", "estilo", v)} />
            </Campo>
            {f.diseno.estilo === "Otro" && (
              <Campo label="¿Qué estilo?" {...c("diseno", "estiloOtro", false)}>
                <input type="text" {...inp("diseno", "estiloOtro")} />
              </Campo>
            )}
            <Campo label="Temática o personajes" {...c("diseno", "tematica")}>
              <input type="text" {...inp("diseno", "tematica")} />
            </Campo>
            <Campo label="Colores preferidos" {...c("diseno", "colores")}>
              <input type="text" placeholder="Ej. Rosa palo y dorado" {...inp("diseno", "colores")} />
            </Campo>
            <Campo label="¿Incluir fotografías personales?" {...c("diseno", "fotosPersonales")}>
              <Chips opciones={["Sí", "No"]} valor={f.diseno.fotosPersonales} onChange={(v) => set("diseno", "fotosPersonales", v)} />
            </Campo>
            <Campo label="Imágenes o referencias del diseño" {...c("diseno", "referenciasTexto", false)}>
              <textarea placeholder="Describe o pega enlaces (Pinterest, Instagram…). Las imágenes nos las puedes mandar por WhatsApp al final." {...inp("diseno", "referenciasTexto")} />
            </Campo>
            <Campo label="Frase o mensaje personalizado" {...c("diseno", "frase", false)}>
              <textarea {...inp("diseno", "frase")} />
            </Campo>
            <Campo label="Texto adicional que deseas incluir" {...c("diseno", "textoAdicional", false)}>
              <textarea {...inp("diseno", "textoAdicional")} />
            </Campo>
          </div>
        </section>

        {/* 3. Funciones */}
        <section className="section" id="funciones">
          <h2><span className="num">3.</span>Funciones interactivas</h2>
          <p className="hint">Selecciona las funciones que deseas incluir. Al marcar una, puedes darnos más detalles.</p>
          <div className="checks">
            {FUNCIONES.map((fn, i) => {
              const activa = f.funciones.includes(fn);
              const llave = llaveDetalle("funciones", i);
              return (
                <div className="check-item" key={fn}>
                  <label className={`check ${activa ? "on" : ""}`}>
                    <input type="checkbox" checked={activa} onChange={() => toggleFuncion(fn)} />
                    {fn}
                  </label>
                  {activa && (
                    <div className="mas-caja">
                      <input
                        type="text"
                        placeholder={FUNCIONES_AYUDA[fn] || "Detalles (opcional)"}
                        value={f.detalles[llave] || ""}
                        onChange={(e) => setDetalle(llave, e.target.value)}
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          <div className={`field ${f.funcionOtra ? "lleno" : ""}`} style={{ marginTop: 14 }}>
            <label>Otra función</label>
            <input type="text" placeholder="Describe la función que te gustaría" value={f.funcionOtra} onChange={(e) => setF((p) => ({ ...p, funcionOtra: e.target.value }))} />
          </div>
        </section>

        {/* 4. Confirmación */}
        <section className="section" id="confirmacion">
          <h2><span className="num">4.</span>Confirmación de asistencia</h2>
          <div className="grid">
            <div className="grid two">
              <Campo label="¿Quién recibirá las confirmaciones?" {...c("confirmacion", "responsable")}>
                <input type="text" {...inp("confirmacion", "responsable")} />
              </Campo>
              <Campo label="Número de WhatsApp" {...c("confirmacion", "whatsapp")}>
                <input type="tel" inputMode="numeric" placeholder="10 dígitos" {...inp("confirmacion", "whatsapp")} />
              </Campo>
            </div>
            <Campo label="Fecha límite para confirmar" {...c("confirmacion", "fechaLimite")}>
              <input type="date" {...inp("confirmacion", "fechaLimite")} />
            </Campo>
            <Campo label="¿Deseas que los invitados indiquen cuántas personas asistirán?" {...c("confirmacion", "cuantasPersonas")}>
              <Chips opciones={["Sí", "No"]} valor={f.confirmacion.cuantasPersonas} onChange={(v) => set("confirmacion", "cuantasPersonas", v)} />
            </Campo>
            <Campo label="¿Deseas solicitar el nombre de cada asistente?" {...c("confirmacion", "nombreAsistentes")}>
              <Chips opciones={["Sí", "No"]} valor={f.confirmacion.nombreAsistentes} onChange={(v) => set("confirmacion", "nombreAsistentes", v)} />
            </Campo>
          </div>
        </section>

        {/* 5. Itinerario */}
        <section className="section" id="itinerario">
          <h2><span className="num">5.</span>Itinerario</h2>
          <p className="hint">Indica las actividades que deseas mostrar, junto con sus horarios.</p>
          <div className="grid">
            <Campo label="Ceremonia" {...c("itinerario", "ceremonia")}>
              <input type="text" placeholder="Ej. 5:00 PM – Parroquia San José" {...inp("itinerario", "ceremonia")} />
            </Campo>
            <Campo label="Recepción" {...c("itinerario", "recepcion")}>
              <input type="text" placeholder="Ej. 7:00 PM – Jardín Las Palmas" {...inp("itinerario", "recepcion")} />
            </Campo>
            <Campo label="Comida o cena" {...c("itinerario", "comida")}>
              <input type="text" placeholder="Ej. 8:30 PM" {...inp("itinerario", "comida")} />
            </Campo>
            <Campo label="Vals o brindis" {...c("itinerario", "vals")}>
              <input type="text" placeholder="Ej. 10:00 PM" {...inp("itinerario", "vals")} />
            </Campo>
            <Campo label="Otros momentos importantes" {...c("itinerario", "otros", false)}>
              <textarea placeholder="Ej. 11:00 PM – Hora loca" {...inp("itinerario", "otros")} />
            </Campo>
          </div>
        </section>

        {/* 6. Material */}
        <section className="section" id="material">
          <h2><span className="num">6.</span>Material para la invitación</h2>
          <div className="grid">
            <div className="aviso">
              📷 <strong>Fotografías e imágenes de referencia:</strong> al enviar esta ficha te aparecerá un botón para mandárnoslas por WhatsApp junto con tu folio.
            </div>
            <Campo label="¿Tienes tus fotos en una carpeta? Pega el enlace (opcional)" {...c("material", "enlaceFotos")}>
              <input type="url" placeholder="Google Drive, Google Fotos, iCloud…" {...inp("material", "enlaceFotos")} />
            </Campo>
            <Campo label="Enlaces de canciones (si tienes alguna preferida)" {...c("material", "canciones", false)}>
              <textarea placeholder="Pega enlaces de YouTube o Spotify" {...inp("material", "canciones")} />
            </Campo>
            <Campo label="Frases, nombres o textos que deban aparecer exactamente como los escribes" {...c("material", "textosExactos", false)}>
              <textarea {...inp("material", "textosExactos")} />
            </Campo>
          </div>
        </section>

        {/* Comentarios finales */}
        <section className="section">
          <h2>¿Algo más que debamos saber?</h2>
          <p className="hint">Cualquier idea, petición especial o detalle que no hayas podido poner arriba.</p>
          <div className={`field ${f.comentarios ? "lleno" : ""}`}>
            <textarea
              placeholder="Escribe aquí tus comentarios…"
              value={f.comentarios}
              onChange={(e) => setF((p) => ({ ...p, comentarios: e.target.value }))}
            />
          </div>
        </section>

        {error && <div className="alert err">{error}</div>}

        <div style={{ marginTop: 20 }}>
          <button className="btn primary" type="submit" disabled={enviando}>
            {enviando ? "Enviando…" : "Enviar ficha ✨"}
          </button>
          <p className="footer-note">¡Listo! Con esta información podremos personalizar tu invitación digital.</p>
        </div>
      </form>
    </main>
  );
}
