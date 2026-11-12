/* Ficha de un recurso. CC BY-NC-SA 4.0 · Ana Bravo Castillo */
(function () {
  const B = window.Banco, $ = id => document.getElementById(id), E = B.esc;
  const id = new URLSearchParams(location.search).get("id") || "";

  function materiales(r, sitio) {
    const ms = r.materiales || [];
    const sol = B.bajoSolicitud(r) && r.estado !== "En preparación";
    const aviso = sol ? `<div class="solicitud"><p>Este recurso no es de acceso directo. Puedes solicitarlo escribiendo a <b>${E(sitio.correo_solicitudes || "")}</b>.</p>
      <a class="btn" href="${E(B.mailtoSolicitud(r, sitio))}">Solicitar acceso</a></div>` : "";
    if (!ms.length) return aviso || `<p class="note">Los materiales de este recurso estarán disponibles próximamente.</p>`;
    return aviso + `<ul class="mats">${ms.map((m, i) => {
      const u = B.enlaceDe(m);
      const ext = /^https?:/i.test(u) ? "Abrir" : "Descargar";
      const btn = sol ? `<span class="soon lockd">Bajo solicitud</span>`
        : u && r.estado !== "En preparación"
        ? `<a class="btn" href="${E(u)}" target="_blank" rel="noopener" data-mat="${i}">${ext} <span aria-hidden="true">↗</span></a>`
        : `<span class="soon">Próximamente</span>`;
      return `<li><span class="ico">${B.iconoDe(m.formato)}</span><span class="txt"><b>${E(m.nombre || "Material")}</b><span>${E(m.formato || "")}</span></span>${btn}</li>`;
    }).join("")}</ul>`;
  }

  function autoria(r) {
    const a = r.autoria || [];
    if (!a.length) return `<p class="note">Sin información de autoría.</p>`;
    return `<ul class="people">${a.map(p => {
      const grado = [p.grado, (p.porcentaje || p.porcentaje === 0) ? `${p.porcentaje} %` : ""].filter(Boolean).join(" · ");
      return `<li>
        <div class="who"><b>${E([p.nombre, p.apellidos].filter(Boolean).join(" "))}</b>${grado ? `<span class="grado">${E(grado)}</span>` : ""}</div>
        <div class="aff">${E(p.institucion || "")}${p.orcid ? `${p.institucion ? " · " : ""}<a class="orcid" href="https://orcid.org/${E(p.orcid)}" target="_blank" rel="noopener"><svg width="14" height="14" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="#a6ce39"/><text x="12" y="16.5" font-size="11" font-family="Arial" font-weight="700" text-anchor="middle" fill="#fff">iD</text></svg>${E(p.orcid)}</a>` : ""}</div>
        <div class="roles" aria-label="Roles CRediT">${(p.roles || []).map(x => `<span>${E(x)}</span>`).join("")}</div>
      </li>`;
    }).join("")}</ul><p class="note">Roles según la taxonomía <a href="https://credit.niso.org/" target="_blank" rel="noopener">CRediT</a>.</p>`;
  }

  // Texto con saltos de línea -> párrafos; líneas que empiezan por "- " -> lista
  function texto(t) {
    const lineas = String(t || "").split(/\r?\n/);
    let html = "", lista = [];
    const cerrar = () => { if (lista.length) { html += `<ul class="lista">${lista.map(x => `<li>${E(x)}</li>`).join("")}</ul>`; lista = []; } };
    lineas.forEach(l => {
      const m = l.match(/^\s*[-•*]\s+(.*)$/);
      if (m) { lista.push(m[1]); return; }
      cerrar();
      if (l.trim()) html += `<p class="desc">${E(l.trim())}</p>`;
    });
    cerrar();
    return html;
  }

  function objetivos(r) {
    const o = (r.objetivos || []).filter(x => String(x || "").trim());
    if (!o.length) return "";
    return `<div class="panel"><h2>${o.length === 1 ? "Objetivo" : "Objetivos"}</h2><ul class="lista">${o.map(x => `<li>${E(x)}</li>`).join("")}</ul></div>`;
  }

  function competencias(r) {
    const c = (r.competencias || []).filter(x => x && (x.codigo || x.descripcion));
    if (!c.length) return "";
    return `<div class="panel"><h2>Competencias</h2><ul class="comps">${c.map(x =>
      `<li>${x.codigo ? `<span class="code">${E(x.codigo)}</span>` : ""}<span>${E(x.descripcion || "")}</span></li>`).join("")}</ul></div>`;
  }

  function apartados(r) {
    return (r.apartados || []).filter(a => a && (a.titulo || a.contenido)).map(a =>
      `<div class="panel"><h2>${E(a.titulo || "")}</h2>${texto(a.contenido)}</div>`).join("");
  }

  const num = v => (v === null || v === undefined || v === "" || isNaN(Number(v))) ? null : Number(v);
  function usosOrdenados(r) {
    return (r.uso || []).filter(u => u && u.curso_academico)
      .slice().sort((a, b) => B.normCurso(a.curso_academico).localeCompare(B.normCurso(b.curso_academico)));
  }
  function dondePanel(r) {
    const filas = [];
    if (r.transversal) filas.push(`<li><b>Recurso transversal</b><span>Utilizable en todas las asignaturas</span></li>`);
    const asigs = [{ titulacion: r.titulacion, asignatura: r.asignatura, curso: r.curso }].concat(r.otras_asignaturas || [])
      .filter(a => a && a.asignatura && a.asignatura !== "Transversal");
    asigs.forEach(a => filas.push(`<li><b>${E(a.asignatura)}${a.curso ? " · " + E(a.curso) : ""}</b><span>${E(a.titulacion || "")}</span></li>`));
    return filas.length ? `<ul class="donde">${filas.join("")}</ul>` : "";
  }
  function usoPanel(r) {
    const u = usosOrdenados(r);
    const donde = dondePanel(r);
    if (!u.length) return donde ? `<div class="panel"><h2>Uso en la docencia</h2>${donde}</div>` : "";
    const totalEst = u.reduce((s, x) => s + (num(x.estudiantes) || 0), 0);
    const totalGr = u.reduce((s, x) => s + (num(x.grupos) || 0), 0);
    const filas = u.map(x => {
      const g = num(x.grupos), e = num(x.estudiantes);
      const datos = [g !== null ? `${g} ${g === 1 ? "grupo" : "grupos"}` : "", e !== null ? `${e} estudiantes` : ""].filter(Boolean).join(" · ");
      return `<li><b>${E(B.normCurso(x.curso_academico))}</b>${datos ? `<span class="nums">${E(datos)}</span>` : ""}${x.asignatura ? `<span class="obs">${E(x.asignatura)}</span>` : ""}${x.observaciones ? `<span class="obs">${E(x.observaciones)}</span>` : ""}</li>`;
    }).join("");
    const resumen = [`${u.length} ${u.length === 1 ? "curso académico" : "cursos académicos"}`,
      totalGr ? `${totalGr} ${totalGr === 1 ? "grupo" : "grupos"}` : "",
      totalEst ? `${totalEst} estudiantes` : ""].filter(Boolean).join(" · ");
    return `<div class="panel"><h2>Uso en la docencia</h2>${donde}<ul class="usos">${filas}</ul><p class="total">Total: ${E(resumen)}</p></div>`;
  }
  function desde(r) {
    const u = usosOrdenados(r);
    return u.length ? B.normCurso(u[0].curso_academico) : (r.curso_inicio || "");
  }

  function iaPanel(r, sitio) {
    const t = B.iaTexto(r, sitio);
    if (!t) return "";
    const acl = r.ia && r.ia.aclaracion ? `<p class="desc small">${E(r.ia.aclaracion)}</p>` : "";
    return `<div class="panel"><h2>Uso de inteligencia artificial generativa</h2><div class="ia-box"><p class="desc small">${E(t)}</p>${acl}</div></div>`;
  }

  function verTambien(r, recursos, color) {
    const rel = B.relacionadosDe(r, recursos);
    if (!rel.length) return "";
    return `<div class="panel"><h2>Ver también</h2><ul class="rel">${rel.map(x => {
      const [c] = color[x.asignatura] || ["#411e61"];
      return `<li style="--c:${c}"><a href="recurso.html?id=${encodeURIComponent(x.id)}"><b>${E(x.titulo)}</b><span>${E(x.tipo || "")} · ${E(x.asignatura || "")}</span></a></li>`;
    }).join("")}</ul></div>`;
  }

  B.cargar().then(({ sitio, recursos }) => {
    $("brandName").textContent = sitio.titulo_corto || "Banco de recursos educativos";
    $("footAutora").textContent = `${sitio.autora} · ${sitio.institucion} · Versión ${sitio.version}`;
    const r = recursos.find(x => x.id === id);
    if (!r) { $("ficha").innerHTML = `<p class="error">No se ha encontrado este recurso. <a href="./">Volver al catálogo</a></p>`; return; }
    const orden = B.ordenAsignaturas(sitio, recursos), color = B.colores(orden);
    const [c, cs] = color[r.asignatura] || ["#411e61", "#eee7f4"];
    const enPrep = !B.disponible(r);
    document.title = `${r.titulo} · ${sitio.titulo_corto || "Banco de recursos"}`;
    $("ficha").style.setProperty("--c", c); $("ficha").style.setProperty("--cs", cs);
    $("ficha").innerHTML = `
      <p class="crumbs"><a href="./#catalogo">Catálogo</a> › <a href="./?asignatura=${encodeURIComponent(r.asignatura)}#catalogo">${E(r.asignatura)}</a></p>
      <div class="ficha-h">
        <span class="tag" style="--c:${c};--cs:${cs}">${E(r.tipo || "Recurso")}</span>
        <h1>${E(r.titulo)}</h1>
        <div class="meta">
          <span><b>${E(r.titulacion)}</b></span>
          <span>${E(r.asignatura)}${r.curso ? " · " + E(r.curso) + " curso" : ""}</span>
          ${r.tema ? `<span>${E(r.tema)}</span>` : ""}
          <span class="${enPrep ? "estado-wip" : "estado-ok"}">${enPrep ? "En preparación" : "Disponible"}</span>
          ${B.bajoSolicitud(r) ? `<span class="estado-wip">Acceso bajo solicitud</span>` : `<span>Acceso abierto</span>`}
          ${r.transversal && r.asignatura !== "Transversal" ? `<span>Transversal</span>` : ""}
          ${desde(r) ? `<span>En uso desde ${E(desde(r))}</span>` : ""}
        </div>
        ${(r.metodologias || []).length ? `<div class="meta metod"><span class="lbl">Metodologías</span>${r.metodologias.map(m => `<a href="./?metodologia=${encodeURIComponent(m)}#catalogo">${E(m)}</a>`).join("")}</div>` : ""}
      </div>
      <div class="ficha">
        <div>
          <div class="panel"><h2>Descripción</h2>${texto(r.descripcion)}</div>
          ${objetivos(r)}
          ${competencias(r)}
          <div class="panel"><h2>Materiales</h2>${materiales(r, sitio)}</div>
          ${apartados(r)}
          ${verTambien(r, recursos, color)}
        </div>
        <div>
          ${usoPanel(r)}
          <div class="panel"><h2>Autoría</h2>${autoria(r)}</div>
          ${iaPanel(r, sitio)}
          <div class="panel"><h2>Cómo citar este recurso</h2>
            <div class="cite" id="cita">${B.citaRecurso(r, sitio)}</div>
            <button class="btn ghost" id="copiar">Copiar cita</button>
            <p class="note">Licencia <a href="${E(sitio.licencia_url)}" target="_blank" rel="noopener">${E(sitio.licencia)}</a>${r.actualizado ? ` · Actualizado el ${E(new Date(r.actualizado + "T12:00:00").toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" }))}` : ""}</p>
          </div>
        </div>
      </div>`;
    $("copiar").addEventListener("click", () => B.copiar($("cita")));
    $("ficha").addEventListener("click", e => {
      const a = e.target.closest("[data-mat]"); if (a) B.contarClic(r, (r.materiales || [])[Number(a.dataset.mat)]);
    });
  }).catch(err => {
    console.error(err);
    $("ficha").innerHTML = `<p class="error">No se ha podido cargar el recurso. Vuelve a intentarlo en unos minutos.</p>`;
  });
})();
