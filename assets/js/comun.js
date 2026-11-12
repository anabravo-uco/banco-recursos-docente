/* Funciones compartidas por el catálogo y la ficha. CC BY-NC-SA 4.0 · Ana Bravo Castillo */
(function () {
  // Colores del Departamento de Psicología (UCO). El amarillo del logo se usa en versión oscura
  // (#8a6d00) para que el texto blanco sobre él sea legible.
  const PALETA = [
    ["#411e61", "#eee7f4"], ["#b41d42", "#fbe8ed"], ["#1c1f56", "#e6e7f3"],
    ["#8a6d00", "#fbf3d4"], ["#8c2a62", "#f6e6f0"], ["#5f5670", "#efedf2"],
    ["#553273", "#f0eaf6"], ["#2e4a7a", "#e6edf6"]
  ];
  const ICONOS = {
    app: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18"/><circle cx="6.5" cy="6.5" r=".6" fill="currentColor"/><circle cx="9" cy="6.5" r=".6" fill="currentColor"/></svg>',
    genially: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l2.2 5.3L20 9l-4.4 3.8L17 19l-5-3-5 3 1.4-6.2L4 9l5.8-.7z"/></svg>',
    canva: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4"/><path d="M8 15l3-3 2 2 3-4"/></svg>',
    pdf: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
    imagen: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="1.8"/><path d="M21 16l-5-5-9 9"/></svg>',
    video: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10 9l5 3-5 3z"/></svg>',
    otro: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M10 14a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 10a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>'
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function iconoDe(formato) {
    const f = String(formato || "").toLowerCase();
    if (f.includes("apps script") || f.includes("aplicación")) return ICONOS.app;
    if (f.includes("genially")) return ICONOS.genially;
    if (f.includes("canva")) return ICONOS.canva;
    if (f.includes("pdf") || f.includes("documento")) return ICONOS.pdf;
    if (f.includes("imagen")) return ICONOS.imagen;
    if (f.includes("vídeo") || f.includes("video")) return ICONOS.video;
    return ICONOS.otro;
  }
  function formatoCorto(formato) {
    const f = String(formato || "");
    if (/apps script/i.test(f)) return "Apps Script";
    if (/pdf/i.test(f)) return "PDF";
    return f;
  }
  // Ruta pública de un archivo subido desde el panel (/materiales/x.pdf -> materiales/x.pdf)
  function rutaArchivo(p) {
    if (!p) return "";
    if (/^https?:\/\//i.test(p)) return p;
    p = String(p).replace(/^\/+/, "").replace(/^banco-recursos\//, "");
    return encodeURI(decodeURI(p));
  }
  function enlaceDe(m) {
    if (!m) return "";
    if (m.url && /^https:\/\//i.test(m.url)) return m.url;
    if (m.archivo) return rutaArchivo(m.archivo);
    return "";
  }
  function primerEnlace(r) {
    for (const m of r.materiales || []) { const u = enlaceDe(m); if (u) return { url: u, m }; }
    return null;
  }
  function disponible(r) { return r.estado !== "En preparación" && (r.acceso === "Bajo solicitud" || !!primerEnlace(r)); }

  function temaClave(t) {
    const m = String(t || "").match(/(\d+)/);
    return m ? [0, parseInt(m[1], 10), String(t)] : [1, 0, String(t || "")];
  }
  function cmpTema(a, b) {
    const x = temaClave(a), y = temaClave(b);
    return x[0] - y[0] || x[1] - y[1] || x[2].localeCompare(y[2], "es");
  }

  function colores(asignaturas) {
    const map = {};
    asignaturas.forEach((a, i) => { map[a] = PALETA[i % PALETA.length]; });
    return map;
  }
  function ordenAsignaturas(sitio, recursos) {
    const base = (sitio.orden_asignaturas || []).slice();
    recursos.forEach(r => asignaturasDe(r).forEach(a => { if (!base.includes(a)) base.push(a); }));
    return base.filter(a => recursos.some(r => asignaturasDe(r).includes(a)));
  }

  function iniciales(nombre) {
    return String(nombre || "").split(/[\s-]+/).filter(Boolean).map(n => n[0].toUpperCase() + ".").join(" ");
  }
  function autoresCita(autoria, sitio) {
    const lista = (autoria || []).filter(a => a.apellidos || a.nombre).map(a => `${a.apellidos}, ${iniciales(a.nombre)}`);
    if (!lista.length) return sitio.autoria_cita || sitio.autora || "";
    if (lista.length === 1) return lista[0];
    return lista.slice(0, -1).join(", ") + " y " + lista[lista.length - 1];
  }
  function urlSitio() { return location.href.split(/[?#]/)[0].replace(/(index|recurso)\.html$/, ""); }
  function doiUrl(sitio) { return sitio.doi ? "https://doi.org/" + String(sitio.doi).replace(/^https?:\/\/doi\.org\//i, "") : ""; }
  function citaBanco(sitio) {
    const ref = doiUrl(sitio) || urlSitio();
    return `${sitio.autoria_cita} (${sitio.anio}). <em>${esc(sitio.titulo)}</em> (Versión ${esc(sitio.version)}) [Recurso educativo]. Zenodo. ${esc(ref)}`;
  }
  function citaRecurso(r, sitio) {
    const ref = doiUrl(sitio) || urlSitio() + "recurso.html?id=" + encodeURIComponent(r.id);
    const anio = r.anio || sitio.anio;
    return `${esc(autoresCita(r.autoria, sitio))} (${esc(anio)}). <em>${esc(r.titulo)}</em> [${esc(r.tipo)}]. En <em>${esc(sitio.titulo)}</em> (Versión ${esc(sitio.version)}). Zenodo. ${esc(ref)}`;
  }

  /* Uso por cursos académicos */
  const normCurso = c => String(c || "").trim().replace("-", "/");
  const num = v => (v === null || v === undefined || v === "" || isNaN(Number(v))) ? null : Number(v);
  function usos(r) { return (r.uso || []).filter(u => u && u.curso_academico); }
  function cursosDe(r) { return [...new Set(usos(r).map(u => normCurso(u.curso_academico)))].sort(); }
  function estudiantesDe(r) { return usos(r).reduce((s, u) => s + (num(u.estudiantes) || 0), 0); }
  function cursosAcademicos(sitio, recursos) {
    const set = new Set((sitio.cursos_academicos || []).map(normCurso).filter(Boolean));
    recursos.forEach(r => cursosDe(r).forEach(c => set.add(c)));
    return [...set].sort();
  }

  /* Asignaturas y titulaciones (principal + otras) */
  function asignaturasDe(r) {
    return [...new Set([r.asignatura].concat((r.otras_asignaturas || []).map(o => o && o.asignatura)).filter(Boolean))];
  }
  function titulacionesDe(r) {
    return [...new Set([r.titulacion].concat((r.otras_asignaturas || []).map(o => o && o.titulacion)).filter(Boolean))];
  }

  /* Recursos relacionados: el panel guarda la ruta del archivo (_data/recursos/x.json) */
  function idDeRef(v) {
    const s = String(v || "").split("/").pop().replace(/\.json$/i, "");
    return s;
  }
  function relacionadosDe(r, recursos) {
    const ids = new Set((r.relacionados || []).map(idDeRef));
    recursos.forEach(x => { if (x.id !== r.id && (x.relacionados || []).map(idDeRef).includes(r.id)) ids.add(x.id); });
    ids.delete(r.id);
    return recursos.filter(x => ids.has(x.id));
  }

  /* Acceso */
  const bajoSolicitud = r => r.acceso === "Bajo solicitud";
  function mailtoSolicitud(r, sitio) {
    const asunto = `Solicitud de acceso: ${r.titulo}`;
    const cuerpo = `Hola, ${String(sitio.autora || "").split(" ")[0]}:\n\nMe gustaría solicitar acceso al recurso «${r.titulo}» del ${sitio.titulo}.\n\nNombre:\nInstitución:\nUso previsto:\n\nGracias.`;
    return `mailto:${sitio.correo_solicitudes || ""}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(cuerpo)}`;
  }

  /* Declaración de uso de IA generativa */
  const GRADOS_IA = {
    "Puntual": "Su uso ha sido puntual, como apoyo en tareas concretas.",
    "Parcial": "Su uso ha afectado a una parte del contenido del recurso.",
    "Sustancial": "Su uso ha sido sustancial en la elaboración del contenido."
  };
  function lista(a) { return a.length <= 1 ? (a[0] || "") : a.slice(0, -1).join(", ") + " y " + a[a.length - 1]; }
  function iaUsada(r) { return r.ia && r.ia.usada === "Sí"; }
  function iaTexto(r, sitio) {
    const ia = r.ia || {};
    if (ia.usada === "No") return "En la elaboración de este recurso no se ha utilizado inteligencia artificial generativa.";
    if (ia.usada !== "Sí") return "";
    const h = (ia.herramientas || []).concat(ia.otra_herramienta ? [ia.otra_herramienta] : []).filter(Boolean);
    const f = (ia.fines || []).filter(Boolean);
    let t = "En la elaboración de este recurso se ha utilizado inteligencia artificial generativa" + (h.length ? ` (${lista(h)})` : "");
    t += f.length ? ` como apoyo para ${lista(f)}.` : ".";
    if (GRADOS_IA[ia.grado]) t += " " + GRADOS_IA[ia.grado];
    const autores = (r.autoria || []).map(a => [a.nombre, a.apellidos].filter(Boolean).join(" ")).filter(Boolean);
    t += autores.length > 1
      ? " Las personas autoras han revisado, editado y validado la totalidad del contenido y asumen la responsabilidad sobre su exactitud científica y su adecuación didáctica."
      : ` ${autores[0] || sitio.autora} ha revisado, editado y validado la totalidad del contenido y asume la responsabilidad sobre su exactitud científica y su adecuación didáctica.`;
    return t;
  }

  /* Estadísticas de visitas (GoatCounter) */
  function contarClic(r, m) {
    try {
      if (window.goatcounter && window.goatcounter.count)
        window.goatcounter.count({ path: "abrir-" + r.id, title: `${r.titulo} · ${m && m.nombre || ""}`, event: true });
    } catch (e) { /* sin estadísticas */ }
  }
  async function visitasTotales(sitio) {
    if (!sitio.goatcounter) return null;
    try {
      const x = await fetch(`https://${sitio.goatcounter}.goatcounter.com/counter/TOTAL.json`);
      if (!x.ok) return null;
      const d = await x.json();
      return d.count || null;
    } catch (e) { return null; }
  }

  async function cargar() {
    const [s, r] = await Promise.all([
      fetch("datos/sitio.json", { cache: "no-cache" }).then(x => { if (!x.ok) throw new Error(x.status); return x.json(); }),
      fetch("datos/recursos.json", { cache: "no-cache" }).then(x => { if (!x.ok) throw new Error(x.status); return x.json(); })
    ]);
    const recursos = Object.keys(r).map(id => Object.assign({ id }, r[id])).filter(x => x.visible !== false && x.titulo);
    if (s.goatcounter) {
      const g = document.createElement("script");
      g.async = true; g.src = "https://gc.zgo.at/count.js";
      g.setAttribute("data-goatcounter", `https://${s.goatcounter}.goatcounter.com/count`);
      document.body.appendChild(g);
    }
    return { sitio: s, recursos };
  }

  let toastT;
  function toast(msg) {
    let t = document.querySelector(".toast");
    if (!t) { t = document.createElement("div"); t.className = "toast"; t.setAttribute("role", "status"); document.body.appendChild(t); }
    t.textContent = msg; t.classList.add("show");
    clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2400);
  }
  async function copiar(el) {
    const texto = el.innerText.trim();
    try { await navigator.clipboard.writeText(texto); toast("Cita copiada"); }
    catch (e) {
      const r = document.createRange(); r.selectNodeContents(el);
      const s = getSelection(); s.removeAllRanges(); s.addRange(r); toast("Pulsa Ctrl+C para copiar");
    }
  }

  window.Banco = { esc, iconoDe, formatoCorto, enlaceDe, primerEnlace, disponible, cmpTema, colores, ordenAsignaturas,
    autoresCita, citaBanco, citaRecurso, doiUrl, cargar, copiar, toast,
    normCurso, num, usos, cursosDe, estudiantesDe, cursosAcademicos, asignaturasDe, titulacionesDe, relacionadosDe,
    bajoSolicitud, mailtoSolicitud, iaUsada, iaTexto, contarClic, visitasTotales };
})();
