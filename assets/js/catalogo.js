/* Catálogo público. CC BY-NC-SA 4.0 · Ana Bravo Castillo */
(function () {
  const B = window.Banco, $ = id => document.getElementById(id), E = B.esc;
  let sitio = {}, recursos = [], orden = [], color = {}, cursosAc = [];
  const st = { q: "", asig: "", tit: "", tipo: "", formato: "", tema: "", curso: "", met: "", acc: "", orden: "asignatura" };
  const PARAM = { q: "q", asig: "asignatura", tit: "titulacion", tipo: "tipo", formato: "formato", tema: "tema",
    curso: "curso", met: "metodologia", acc: "acceso", orden: "orden" };
  const SELECTS = [["fTit", "tit"], ["fTipo", "tipo"], ["fFormato", "formato"], ["fTema", "tema"],
    ["fCurso", "curso"], ["fMet", "met"], ["fAcc", "acc"], ["fOrden", "orden"]];

  const ICO = {
    est: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 10L12 5 2 10l10 5 10-5z"/><path d="M6 12v5c3 2 9 2 12 0v-5"/></svg>',
    lock: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/></svg>',
    ia: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 3l1.8 4.7L18.5 9.5l-4.7 1.8L12 16l-1.8-4.7L5.5 9.5l4.7-1.8z"/><path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z"/></svg>',
    trans: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/></svg>'
  };

  function leerURL() {
    const p = new URLSearchParams(location.search);
    Object.keys(PARAM).forEach(k => { st[k] = p.get(PARAM[k]) || (k === "orden" ? "asignatura" : ""); });
  }
  function escribirURL() {
    const p = new URLSearchParams();
    Object.keys(PARAM).forEach(k => { if (st[k] && !(k === "orden" && st[k] === "asignatura")) p.set(PARAM[k], st[k]); });
    const qs = p.toString();
    history.replaceState(null, "", location.pathname + (qs ? "?" + qs : "") + location.hash);
  }
  const formatos = r => (r.materiales || []).map(m => B.formatoCorto(m.formato)).filter(Boolean);
  const norm = s => String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const hayFiltros = () => ["q", "asig", "tit", "tipo", "formato", "tema", "curso", "met", "acc"].some(k => st[k]);

  function pasa(r, ignorar) {
    if (ignorar !== "asig" && st.asig && !B.asignaturasDe(r).includes(st.asig)) return false;
    if (st.tit && !B.titulacionesDe(r).includes(st.tit)) return false;
    if (st.tipo && r.tipo !== st.tipo) return false;
    if (st.formato && !formatos(r).includes(st.formato)) return false;
    if (st.tema && r.tema !== st.tema) return false;
    if (st.curso && !B.cursosDe(r).includes(st.curso)) return false;
    if (st.met && !(r.metodologias || []).includes(st.met)) return false;
    if (st.acc && (r.acceso || "Abierto") !== st.acc) return false;
    if (st.q) {
      const extra = [].concat(r.objetivos || [], r.metodologias || [],
        (r.competencias || []).map(c => `${c.codigo || ""} ${c.descripcion || ""}`),
        (r.apartados || []).map(a => `${a.titulo || ""} ${a.contenido || ""}`));
      const h = norm([r.titulo, r.descripcion, r.tema, r.titulacion, r.tipo].concat(B.asignaturasDe(r), extra).join(" "));
      if (!norm(st.q).split(/\s+/).every(w => h.includes(w))) return false;
    }
    return true;
  }

  function opciones(id, valores, ph, actual) {
    const s = $(id);
    s.innerHTML = `<option value="">${ph}</option>` + valores.map(v => `<option${v === actual ? " selected" : ""}>${E(v)}</option>`).join("");
  }

  function chips() {
    const base = recursos.filter(r => pasa(r, "asig"));
    const html = [`<button class="chip" aria-pressed="${!st.asig}" data-a="">Todas <small>${base.length}</small></button>`]
      .concat(orden.map(a => {
        const n = base.filter(r => B.asignaturasDe(r).includes(a)).length;
        return `<button class="chip" style="--c:${color[a][0]}" aria-pressed="${st.asig === a}" data-a="${E(a)}"><i></i>${E(a)} <small>${n}</small></button>`;
      }));
    $("chips").innerHTML = html.join("");
  }

  function filaCursos(r) {
    const usados = B.cursosDe(r);
    return `<div class="years" aria-label="Cursos académicos de uso">${cursosAc.map(c =>
      `<span class="${usados.includes(c) ? "on" : ""}"${usados.includes(c) ? "" : ' aria-hidden="true"'}>${E(c)}</span>`).join("")}</div>`;
  }

  function insignias(r) {
    const n = B.estudiantesDe(r), out = [];
    if (r.transversal) out.push(`<span class="ins">${ICO.trans}Transversal</span>`);
    if (B.bajoSolicitud(r)) out.push(`<span class="ins lock">${ICO.lock}Bajo solicitud</span>`);
    if (B.iaUsada(r)) out.push(`<span class="ins">${ICO.ia}Uso de IA declarado</span>`);
    if (n) out.push(`<span class="ins">${ICO.est}${n.toLocaleString("es-ES")} estudiantes</span>`);
    return out.length ? `<div class="insignias">${out.join("")}</div>` : "";
  }

  function tarjeta(r, plano) {
    const [c, cs] = color[r.asignatura] || ["#411e61", "#eee7f4"];
    const pe = B.primerEnlace(r), disp = B.disponible(r);
    const fm = (r.materiales || [])[0];
    const fmt = fm ? `<span class="fmt">${B.iconoDe(fm.formato)}<span>${E(B.formatoCorto(fm.formato))}${r.materiales.length > 1 ? ` · ${r.materiales.length} materiales` : ""}</span></span>` : `<span class="fmt"></span>`;
    let accion;
    if (!disp) accion = `<span class="soon">Próximamente</span>`;
    else if (B.bajoSolicitud(r)) accion = `<a class="btn" href="${E(B.mailtoSolicitud(r, sitio))}">Solicitar acceso</a>`;
    else accion = `<a class="btn" href="${E(pe.url)}" target="_blank" rel="noopener" data-abrir="${E(r.id)}">Abrir <span aria-hidden="true">↗</span><span class="sr-only"> ${E(r.titulo)} (se abre en otra pestaña)</span></a>`;
    const asig = plano ? `<p class="asig-line"><i></i>${E(r.asignatura)}</p>` : "";
    return `<article class="card" style="--c:${c};--cs:${cs}">
      <div class="card-top"><span class="tag">${E(r.tipo || "Recurso")}</span><span class="tema">${E(r.tema || "")}</span></div>
      ${asig}
      <h3><a href="recurso.html?id=${encodeURIComponent(r.id)}">${E(r.titulo)}</a></h3>
      <p>${E(r.descripcion || "")}</p>
      ${insignias(r)}
      ${filaCursos(r)}
      <div class="card-foot">${fmt}${accion}</div>
    </article>`;
  }

  function ordenar(lista) {
    const L = lista.slice(), t = (a, b) => a.titulo.localeCompare(b.titulo, "es");
    if (st.orden === "nombre") return L.sort(t);
    if (st.orden === "recientes") return L.sort((a, b) => String(b.anio || "").localeCompare(String(a.anio || "")) || String(b.actualizado || "").localeCompare(String(a.actualizado || "")) || t(a, b));
    if (st.orden === "cursos") return L.sort((a, b) => B.cursosDe(b).length - B.cursosDe(a).length || B.estudiantesDe(b) - B.estudiantesDe(a) || t(a, b));
    return L.sort((x, y) => B.cmpTema(x.tema, y.tema) || t(x, y));
  }

  function grupo(nombre, g) {
    const tits = [...new Set(g.map(r => r.titulacion).filter(Boolean))].join(" · ");
    const cursos = [...new Set(g.filter(r => r.asignatura === nombre).map(r => r.curso).filter(Boolean))].join(", ");
    return `<section class="group" style="--c:${color[nombre] ? color[nombre][0] : "#411e61"}">
      <div class="group-h"><h2><i></i>${E(nombre)}</h2><span>${E(tits)}${cursos ? " · " + E(cursos) + " curso" : ""} · ${g.length} ${g.length === 1 ? "recurso" : "recursos"}</span></div>
      <div class="grid">${ordenar(g).map(r => tarjeta(r, false)).join("")}</div></section>`;
  }

  function pintar() {
    const lista = recursos.filter(r => pasa(r));
    chips();
    $("count").textContent = lista.length === recursos.length
      ? `${recursos.length} recursos` : `Mostrando ${lista.length} de ${recursos.length} recursos`;
    $("reset").hidden = !hayFiltros();
    if (!lista.length) { $("lista").innerHTML = `<p class="empty">No hay recursos con estos filtros.</p>`; return; }
    if (st.orden !== "asignatura") {
      $("lista").innerHTML = `<div class="grid flat">${ordenar(lista).map(r => tarjeta(r, true)).join("")}</div>`;
    } else if (st.asig) {
      $("lista").innerHTML = grupo(st.asig, lista);
    } else {
      $("lista").innerHTML = orden.map(a => {
        const g = lista.filter(r => r.asignatura === a);
        return g.length ? grupo(a, g) : "";
      }).join("");
    }
  }

  function cabecera() {
    document.title = `${sitio.titulo_corto || "Banco de recursos"} · ${sitio.autora}`;
    $("brandName").textContent = sitio.titulo_corto || "Banco de recursos educativos";
    $("heroUni").textContent = sitio.institucion || "";
    $("heroTitle").innerHTML = E(sitio.titulo || "").replace(/\babiertos\b/, "<em>abiertos</em>");
    $("heroLead").textContent = sitio.presentacion || "";
    $("acercaTexto").textContent = sitio.presentacion || "";
    $("byline").innerHTML = `<strong>${E(sitio.autora)}</strong> · ${E(sitio.departamento)} · ${E(sitio.institucion)}` +
      (sitio.orcid ? ` · <a href="https://orcid.org/${E(sitio.orcid)}" target="_blank" rel="noopener">ORCID ${E(sitio.orcid)}</a>` : "");
    $("footAutora").innerHTML = `${E(sitio.autora)} · ${E(sitio.institucion)} · Versión ${E(sitio.version)}`;
    if (sitio.licencia_url) $("licLink").href = sitio.licencia_url;
    $("citaBanco").innerHTML = B.citaBanco(sitio);
    const d = B.doiUrl(sitio);
    $("doiBadge").innerHTML = d ? `<a class="doi" href="${E(d)}" target="_blank" rel="noopener"><b>DOI</b><span>${E(sitio.doi)}</span></a>` : "";
    $("sTotal").textContent = recursos.length;
    $("sDisp").textContent = recursos.filter(B.disponible).length;
    $("sAsig").textContent = new Set(recursos.flatMap(B.asignaturasDe).filter(a => a !== "Transversal")).size;
    $("sTit").textContent = new Set(recursos.flatMap(B.titulacionesDe).filter(t => t && t !== "Varias titulaciones")).size;
    const part = recursos.reduce((s, r) => s + B.estudiantesDe(r), 0);
    if (part) { $("sPart").textContent = part.toLocaleString("es-ES"); $("sPartWrap").hidden = false; }
    B.visitasTotales(sitio).then(v => { if (v) { $("sVis").textContent = v; $("sVisWrap").hidden = false; } });
  }

  function filtrosFijos() {
    const u = k => [...new Set(recursos.map(k).flat().filter(Boolean))];
    const az = a => a.sort((x, y) => x.localeCompare(y, "es"));
    opciones("fTit", az(u(B.titulacionesDe).filter(t => t !== "Varias titulaciones")), "Todas las titulaciones", st.tit);
    opciones("fTipo", az(u(r => r.tipo)), "Todos los tipos", st.tipo);
    opciones("fFormato", az(u(formatos)), "Todos los formatos", st.formato);
    opciones("fTema", u(r => r.tema).sort(B.cmpTema), "Todos los temas", st.tema);
    opciones("fCurso", cursosAc.slice().reverse(), "Cualquier curso académico", st.curso);
    opciones("fMet", az(u(r => r.metodologias || [])), "Todas las metodologías", st.met);
    $("fAccWrap").hidden = !recursos.some(B.bajoSolicitud);
    $("fAcc").value = st.acc; $("fOrden").value = st.orden; $("q").value = st.q;
  }

  function eventos() {
    let t;
    $("q").addEventListener("input", e => { clearTimeout(t); t = setTimeout(() => { st.q = e.target.value.trim(); escribirURL(); pintar(); }, 150); });
    SELECTS.forEach(([id, k]) => $(id).addEventListener("change", e => { st[k] = e.target.value || (k === "orden" ? "asignatura" : ""); escribirURL(); pintar(); }));
    $("chips").addEventListener("click", e => {
      const b = e.target.closest(".chip"); if (!b) return;
      st.asig = b.dataset.a; escribirURL(); pintar();
    });
    $("lista").addEventListener("click", e => {
      const a = e.target.closest("[data-abrir]"); if (!a) return;
      const r = recursos.find(x => x.id === a.dataset.abrir); if (r) B.contarClic(r, (r.materiales || [])[0]);
    });
    $("reset").addEventListener("click", () => {
      Object.keys(st).forEach(k => st[k] = k === "orden" ? st.orden : "");
      filtrosFijos(); escribirURL(); pintar();
    });
    $("copiarCita").addEventListener("click", () => B.copiar($("citaBanco")));
  }

  leerURL();
  B.cargar().then(d => {
    sitio = d.sitio; recursos = d.recursos;
    orden = B.ordenAsignaturas(sitio, recursos); color = B.colores(orden);
    cursosAc = B.cursosAcademicos(sitio, recursos);
    cabecera(); filtrosFijos(); eventos(); pintar();
  }).catch(err => {
    console.error(err);
    $("lista").innerHTML = `<p class="error">No se han podido cargar los recursos. Vuelve a intentarlo en unos minutos.</p>`;
  });
})();
