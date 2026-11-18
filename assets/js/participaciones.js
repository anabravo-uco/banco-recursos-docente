/* Panel de participaciones de la portada. CC BY-NC-SA 4.0 · Ana Bravo Castillo */
(function () {
  const B = window.Banco, $ = id => document.getElementById(id);
  const FAM = [["Infantil", "inf"], ["Primaria", "pri"], ["Psicolog", "psi"]];
  const familia = t => (FAM.find(f => String(t || "").includes(f[0])) || [0, "otr"])[1];
  const corto = t => String(t || "").replace(/^Grado en /, "");
  const fmt = n => Math.round(n).toLocaleString("es-ES");
  const NOTA = {
    total: "Cada participación es un estudiante que usa un recurso en un curso; quien usa varios recursos cuenta una vez en cada uno.",
    media: "Media = participaciones ÷ veces que se ha usado un recurso. Un recurso usado en tres cursos cuenta tres veces, para no inflar la media."
  };
  let datos = null, vista = "curso", modo = "total";

  function cursoActual() {
    const d = new Date(), y = d.getMonth() >= 8 ? d.getFullYear() : d.getFullYear() - 1;
    return `${y}/${String(y + 1).slice(2)}`;
  }

  function preparar(recursos, sitio) {
    /* Titulación y curso de cada asignatura (principal + otras asignaturas) */
    const info = {};
    const anota = (a, t, c) => {
      if (!a || a === "Transversal" || !t || t === "Varias titulaciones") return;
      if (!info[a]) info[a] = { tit: t, curso: c || "" };
      else if (!info[a].curso && c) info[a].curso = c;
    };
    recursos.forEach(r => {
      anota(r.asignatura, r.titulacion, r.curso);
      (r.otras_asignaturas || []).forEach(o => o && anota(o.asignatura, o.titulacion, o.curso));
    });
    /* Usos: la titulación se toma de la asignatura de cada uso */
    const usos = [];
    recursos.forEach(r => B.usos(r).forEach(u => {
      const a = u.asignatura || (r.asignatura !== "Transversal" ? r.asignatura : "");
      usos.push({ rec: r.id, curso: B.normCurso(u.curso_academico), asig: a || "Sin asignatura", n: B.num(u.estudiantes) || 0 });
    }));
    /* Colores: una gama por titulación y un tono por asignatura */
    const orden = (sitio.orden_asignaturas || []).slice();
    usos.forEach(u => { if (!orden.includes(u.asig)) orden.push(u.asig); });
    const cuenta = {}, color = {};
    orden.filter(a => usos.some(u => u.asig === a)).forEach(a => {
      const f = familia(info[a] && info[a].tit);
      cuenta[f] = (cuenta[f] || 0) + 1;
      color[a] = `var(--pt-${f}-${((cuenta[f] - 1) % 3) + 1})`;
    });
    return { usos, info, color };
  }

  function grupos() {
    const { usos, info, color } = datos;
    const clave = {
      curso: u => u.curso,
      titulacion: u => (info[u.asig] || {}).tit || "Otras titulaciones",
      asignatura: u => u.asig
    }[vista];
    const g = new Map();
    usos.forEach(u => {
      const k = clave(u);
      if (!g.has(k)) g.set(k, { k, n: 0, usosConDato: 0, recs: new Set(), seg: new Map() });
      const x = g.get(k);
      x.n += u.n; if (u.n) x.usosConDato++; x.recs.add(u.rec);
      const sk = vista === "titulacion" ? k : u.asig;
      const sc = vista === "titulacion" ? `var(--pt-${familia(k)}-1)` : color[u.asig];
      if (!x.seg.has(sk)) x.seg.set(sk, { color: sc, n: 0 });
      x.seg.get(sk).n += u.n;
    });
    const lista = [...g.values()];
    if (vista === "curso") lista.sort((a, b) => a.k.localeCompare(b.k));
    else lista.sort((a, b) => b.n - a.n);
    return lista;
  }

  function etiqueta(k) {
    if (vista === "curso") return B.esc(k) + (k === cursoActual() ? " <small>· en curso</small>" : "");
    if (vista === "titulacion") return B.esc(k);
    const i = datos.info[k];
    return B.esc(k) + (i ? ` <small>· ${B.esc(corto(i.tit))}${i.curso ? " " + B.esc(i.curso) : ""}</small>` : "");
  }

  function dibujar() {
    if (!datos) return;
    const lista = grupos();
    const val = x => modo === "total" ? x.n : (x.usosConDato ? x.n / x.usosConDato : 0);
    const max = Math.max(1, ...lista.map(val));
    $("partBarras").innerHTML = lista.map(x => {
      const w = val(x) / max * 100, nr = x.recs.size;
      const cifra = modo === "total" ? fmt(x.n) : `${fmt(val(x))} por recurso`;
      const segs = [...x.seg.values()].map(s =>
        `<span style="width:${x.n ? (w * s.n / x.n).toFixed(2) : 0}%;background:${s.color}"></span>`).join("");
      return `<div class="part-fila"><div class="part-et"><span>${etiqueta(x.k)}</span>` +
        `<span><b>${cifra}</b> <small>· ${nr} ${nr === 1 ? "recurso" : "recursos"}</small></span></div>` +
        `<div class="part-barra" aria-hidden="true">${segs}</div></div>`;
    }).join("");

    /* Leyenda de colores solo en la vista por curso */
    $("partLeyenda").innerHTML = vista !== "curso" ? "" : Object.keys(datos.color)
      .map(a => `<span><i style="background:${datos.color[a]}"></i>${B.esc(a)}</span>`).join("");

    const tot = datos.usos.reduce((s, u) => s + u.n, 0);
    const conDato = datos.usos.filter(u => u.n).length;
    const cursos = [...new Set(datos.usos.map(u => u.curso))].sort();
    $("sPart").textContent = modo === "total" ? fmt(tot) : fmt(conDato ? tot / conDato : 0);
    $("sPartTxt").textContent = modo === "total"
      ? `participaciones de estudiantes${cursos.length ? " desde " + cursos[0] : ""}`
      : "estudiantes de media por recurso";
    $("partNota").textContent = NOTA[modo];
    document.querySelectorAll("#sPartWrap [data-vista]").forEach(b => b.setAttribute("aria-pressed", b.dataset.vista === vista));
    document.querySelectorAll("#sPartWrap [data-modo]").forEach(b => b.setAttribute("aria-pressed", b.dataset.modo === modo));
  }

  function pintar(recursos, sitio) {
    datos = preparar(recursos, sitio || {});
    const cursos = new Set(datos.usos.map(u => u.curso));
    if ($("sCursos")) $("sCursos").textContent = cursos.size;
    if (!datos.usos.length) return;
    $("sPartWrap").hidden = false;
    dibujar();
  }

  document.addEventListener("click", e => {
    const b = e.target.closest && e.target.closest("#sPartWrap button");
    if (!b) return;
    if (b.dataset.vista) vista = b.dataset.vista;
    if (b.dataset.modo) modo = b.dataset.modo;
    dibujar();
  });

  window.PanelParticipaciones = { pintar };
})();
