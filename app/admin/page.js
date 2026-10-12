"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from "firebase/firestore";
import { auth, db } from "../../lib/firebase";
import { ESTADOS, ETIQUETAS, FUNCIONES, llaveDetalle, waLink } from "../../lib/campos";

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

const fechaBonita = (iso) => {
  if (!iso) return "Sin fecha";
  const [a, m, d] = iso.split("-").map(Number);
  return new Date(a, m - 1, d).toLocaleDateString("es-MX", { day: "numeric", month: "short", year: "numeric" });
};

/* ---------- Login ---------- */
function Login() {
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [err, setErr] = useState("");
  const entrar = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch {
      setErr("Correo o contraseña incorrectos.");
    }
  };
  return (
    <main className="wrap" style={{ maxWidth: 420 }}>
      <FondoAnimado />
      <div className="hero">
        <p className="brand">MENDOZA INVITACIONES</p>
        <h1>Panel de fichas</h1>
      </div>
      <form className="section grid" onSubmit={entrar}>
        <div className="field">
          <label>Correo</label>
          <input type="text" inputMode="email" autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="field">
          <label>Contraseña</label>
          <input type="password" autoComplete="current-password" value={pass} onChange={(e) => setPass(e.target.value)} />
        </div>
        {err && <div className="alert err">{err}</div>}
        <button className="btn primary" type="submit">Entrar</button>
      </form>
    </main>
  );
}

/* ---------- Detalle ---------- */
function Detalle({ ficha, volver }) {
  const folio = ficha.id.slice(0, 6).toUpperCase();

  const cambiarEstado = (estado) => updateDoc(doc(db, "fichas", ficha.id), { estado });

  const borrar = async () => {
    if (!confirm(`¿Borrar la ficha ${folio}? No se puede deshacer.`)) return;
    await deleteDoc(doc(db, "fichas", ficha.id));
    volver();
  };

  const det = ficha.detalles || {};
  const filas = (sec) =>
    Object.entries(sec.campos)
      .map(([k, etiqueta]) => [etiqueta, ficha[sec.clave]?.[k], det[llaveDetalle(sec.clave, k)]])
      .filter(([, v, d]) => (v && String(v).trim()) || d);

  // Funciones marcadas con sus detalles
  const funciones = (ficha.funciones || []).map((fn) => [fn, det[llaveDetalle("funciones", FUNCIONES.indexOf(fn))]]);
  if (ficha.funcionOtra) funciones.push([`Otra: ${ficha.funcionOtra}`, ""]);

  return (
    <main className="wrap detail">
      <FondoAnimado />
      <div className="admin-top no-print">
        <button className="btn ghost" onClick={volver}>← Volver</button>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <button className="btn ghost" onClick={() => window.print()}>Imprimir / PDF</button>
          <button className="btn ghost" onClick={borrar} style={{ color: "#ffb4ad" }}>Borrar</button>
        </div>
      </div>

      <div className="hero" style={{ paddingBottom: 4 }}>
        <p className="brand">MENDOZA INVITACIONES · FOLIO {folio}</p>
        <h1>{ficha.evento?.tipo || "Evento"} · {ficha.evento?.festejado || ficha.evento?.anfitriones || ficha.contacto?.nombre}</h1>
        <p>{fechaBonita(ficha.evento?.fecha)}</p>
      </div>

      <section className="section no-print">
        <span className="label">Estado</span>
        <div className="chips">
          {Object.entries(ESTADOS).map(([k, v]) => (
            <button key={k} type="button" className={`chip ${ficha.estado === k ? "on" : ""}`} onClick={() => cambiarEstado(k)}>{v}</button>
          ))}
        </div>
        <div className="actions">
          <a className="btn wa" style={{ fontSize: 14, padding: "10px 14px" }} target="_blank" rel="noreferrer"
            href={waLink(ficha.contacto?.whatsapp, `Hola ${ficha.contacto?.nombre}, recibí la ficha de tu invitación (folio ${folio}).`)}>
            WhatsApp al cliente
          </a>
        </div>
      </section>

      {ETIQUETAS.map((sec) => {
        const f = filas(sec);
        if (!f.length) return null;
        return (
          <section className="section" key={sec.clave}>
            <h2>{sec.titulo}</h2>
            <dl>
              {f.map(([k, v, d]) => (
                <div key={k} style={{ display: "contents" }}>
                  <dt>{k}</dt>
                  <dd>
                    {v ? (String(v).startsWith("http") ? <a href={v} target="_blank" rel="noreferrer">{v}</a> : v) : "—"}
                    {d && <span className="extra">➕ {d}</span>}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}

      {funciones.length > 0 && (
        <section className="section">
          <h2>3. Funciones interactivas</h2>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {funciones.map(([fn, d]) => (
              <li key={fn} style={{ marginBottom: 4 }}>
                {fn}
                {d && <span className="extra">➕ {d}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {ficha.comentarios?.trim() && (
        <section className="section">
          <h2>Comentarios finales</h2>
          <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{ficha.comentarios}</p>
        </section>
      )}

    </main>
  );
}

/* ---------- Panel ---------- */
export default function Admin() {
  const [usuario, setUsuario] = useState(undefined);
  const [fichas, setFichas] = useState([]);
  const [filtro, setFiltro] = useState("todas");
  const [abierta, setAbierta] = useState(null);

  useEffect(() => onAuthStateChanged(auth, setUsuario), []);

  useEffect(() => {
    if (!usuario) return;
    const q = query(collection(db, "fichas"), orderBy("creadoEn", "desc"));
    return onSnapshot(q, (snap) => setFichas(snap.docs.map((d) => ({ id: d.id, ...d.data() }))));
  }, [usuario]);

  if (usuario === undefined) return <main className="wrap"><p className="empty">Cargando…</p></main>;
  if (!usuario) return <Login />;

  const actual = abierta && fichas.find((x) => x.id === abierta);
  if (actual) return <Detalle ficha={actual} volver={() => setAbierta(null)} />;

  const visibles = filtro === "todas" ? fichas : fichas.filter((x) => x.estado === filtro);
  const cuenta = (k) => fichas.filter((x) => x.estado === k).length;

  return (
    <main className="wrap">
      <FondoAnimado />
      <div className="admin-top">
        <h1>Fichas recibidas</h1>
        <button className="btn ghost" onClick={() => signOut(auth)}>Salir</button>
      </div>

      <div className="filters">
        <button className={`chip ${filtro === "todas" ? "on" : ""}`} onClick={() => setFiltro("todas")}>Todas ({fichas.length})</button>
        {Object.entries(ESTADOS).map(([k, v]) => (
          <button key={k} className={`chip ${filtro === k ? "on" : ""}`} onClick={() => setFiltro(k)}>{v} ({cuenta(k)})</button>
        ))}
      </div>

      <div className="list">
        {visibles.length === 0 && <p className="empty">No hay fichas aquí todavía.</p>}
        {visibles.map((x) => (
          <button key={x.id} className="item" onClick={() => setAbierta(x.id)}>
            <div>
              <div className="t">{x.evento?.tipo || "Evento"} · {x.evento?.festejado || x.evento?.anfitriones || x.contacto?.nombre}</div>
              <div className="s">{fechaBonita(x.evento?.fecha)} · {x.contacto?.nombre} · Folio {x.id.slice(0, 6).toUpperCase()}</div>
            </div>
            <span className={`badge ${x.estado}`}>{ESTADOS[x.estado] || x.estado}</span>
          </button>
        ))}
      </div>
    </main>
  );
}
