/* Indicadores de uso (página sin enlace en el menú). CC BY-NC-SA 4.0 · Ana Bravo Castillo */
(function () {
  const B = window.Banco, $ = id => document.getElementById(id), E = B.esc;
  const fmt = n => Number(n || 0).toLocaleString("es-ES");

  function filasUso(recursos) {
    // Una fila por entrada de uso, con la asignatura a la que se atribuye
    const F = [];
    recursos.forEach(r => B.usos(r).forEach(u => {
      const asig = u.asignatura || r.asignatura;
      const otra = (r.otras_asignaturas || []).find(o => o && o.asignatura === asig);
      F.push({ r, curso: B.normCurso(u.curso_academico), asig, tit: otra ? otra.titulacion : r.titulacion,
        grupos: B.num(u.grupos) || 0, est: B.num(u.estudiantes) || 0, sinEst: B.num(u.estudiantes) === null });
    }));
    return F;
  }

  function tabla(cab, filas, pie, clase) {
    return `<div class="tbl-wrap"><table class="ind ${clase || ""}"><thead><tr>${cab.map(c => `<th>${c}</th>`).join("")}</tr></thead>
      <tbody>${filas.map(f => `<tr>${f.map(c => `<td>${c}</td>`).join("")}</tr>`).join("")}</tbody>
      ${pie ? `<tfoot><tr>${pie.map(c => `<td>${c}</td>`).join("")}</tr></tfoot>` : ""}</table></div>`;
  }

  B.cargar().then(({ sitio, recursos }) => {
    $("brandName").textContent = sitio.titulo_corto || "Banco de recursos educativos";
    $("footAutora").textContent = `${sitio.autora} · ${sitio.institucion} · Versión ${sitio.version}`;
    const F = filasUso(recursos);
    const cursos = [...new Set(F.map(f => f.curso))].sort();
    const orden = B.ordenAsignaturas(sitio, recursos);
    const conUso = recursos.filter(r => B.usos(r).length);
    const totalPart = F.reduce((s, f) => s + f.est, 0);
    const hoy = new Date().toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" });

    // 1. Por curso académico
    const t1 = cursos.map(c => {
      const x = F.filter(f => f.curso === c);
      return [`<b>${E(c)}</b>`, new Set(x.map(f => f.r.id)).size, new Set(x.map(f => f.asig)).size, fmt(x.reduce((s, f) => s + f.grupos, 0)), fmt(x.reduce((s, f) => s + f.est, 0))];
    });
    const pie1 = ["<b>Total</b>", conUso.length, new Set(F.map(f => f.asig)).size, fmt(F.reduce((s, f) => s + f.grupos, 0)), fmt(totalPart)];

    // 2. Por curso académico y asignatura
    const t2 = [];
    cursos.forEach(c => orden.forEach(a => {
      const x = F.filter(f => f.curso === c && f.asig === a);
      if (!x.length) return;
      t2.push([E(c), E(a), E([...new Set(x.map(f => f.tit))].join(" · ")), new Set(x.map(f => f.r.id)).size,
        fmt(x.reduce((s, f) => s + f.grupos, 0)), fmt(x.reduce((s, f) => s + f.est, 0))]);
    }));

    // 3. Por recurso y curso académico
    const lista = conUso.slice().sort((a, b) => orden.indexOf(a.asignatura) - orden.indexOf(b.asignatura) || B.cmpTema(a.tema, b.tema) || a.titulo.localeCompare(b.titulo, "es"));
    const t3 = lista.map(r => {
      const celdas = cursos.map(c => {
        const x = F.filter(f => f.r.id === r.id && f.curso === c);
        if (!x.length) return `<span class="no">—</span>`;
        const e = x.reduce((s, f) => s + f.est, 0);
        return e ? fmt(e) : `<span class="si" title="Usado (sin número de estudiantes)">✓</span>`;
      });
      return [`<a href="recurso.html?id=${encodeURIComponent(r.id)}">${E(r.titulo)}</a>`, E(r.asignatura)].concat(celdas, [B.estudiantesDe(r) ? `<b>${fmt(B.estudiantesDe(r))}</b>` : `<span class="no" title="Sin número de estudiantes registrado">s. d.</span>`]);
    });

    // Datos pendientes (solo pantalla)
    const sinUso = recursos.filter(r => !B.usos(r).length);
    const sinEst = conUso.filter(r => B.usos(r).some(u => B.num(u.estudiantes) === null));

    $("ind").innerHTML = `
      <div class="ind-h">
        <div>
          <p class="eyebrow">Indicadores de uso</p>
          <h1>${E(sitio.titulo)}</h1>
          <p class="note">${E(sitio.autora)} · ${E(sitio.departamento)} · ${E(sitio.institucion)}${sitio.doi ? ` · DOI ${E(sitio.doi)}` : ""}<br>
          Datos del banco (versión ${E(sitio.version)}) a ${E(hoy)}.</p>
        </div>
        <button class="btn no-print" id="imprimir">Imprimir o guardar en PDF</button>
      </div>
      <div class="stats ind-stats">
        <div class="stat"><b>${recursos.length}</b><span>recursos en el banco</span></div>
        <div class="stat"><b>${conUso.length}</b><span>con uso registrado</span></div>
        <div class="stat"><b>${cursos.length}</b><span>cursos académicos</span></div>
        <div class="stat"><b>${fmt(totalPart)}</b><span>participaciones de estudiantes</span></div>
      </div>
      <h2 class="ind-t">Uso por curso académico</h2>
      ${tabla(["Curso académico", "Recursos utilizados", "Asignaturas", "Grupos", "Participaciones"], t1, pie1, "num")}
      <h2 class="ind-t">Uso por curso académico y asignatura</h2>
      ${tabla(["Curso académico", "Asignatura", "Titulación", "Recursos", "Grupos", "Participaciones"], t2, null, "num2")}
      <h2 class="ind-t">Participaciones por recurso y curso académico</h2>
      ${tabla(["Recurso", "Asignatura"].concat(cursos.map(E), ["Total"]), t3, null, "matriz")}
      <p class="note">Participaciones: suma de estudiantes registrados en cada recurso; una misma persona puede contar en varios recursos. ✓: recurso utilizado ese curso, sin número de estudiantes registrado. s. d.: sin datos de estudiantes.</p>
      <div class="panel no-print pend">
        <h3>Datos pendientes de completar</h3>
        <p>${sinUso.length} recursos sin ningún curso de uso registrado${sinUso.length ? ": " + sinUso.map(r => `<a href="recurso.html?id=${encodeURIComponent(r.id)}">${E(r.titulo)}</a>`).join(", ") : ""}.</p>
        <p>${sinEst.length} recursos con algún curso sin número de estudiantes${sinEst.length ? ": " + sinEst.map(r => `<a href="recurso.html?id=${encodeURIComponent(r.id)}">${E(r.titulo)}</a>`).join(", ") : ""}.</p>
        <p class="note">Este apartado no aparece al imprimir.</p>
      </div>`;
    $("imprimir").addEventListener("click", () => window.print());
  }).catch(err => {
    console.error(err);
    $("ind").innerHTML = `<p class="error">No se han podido cargar los datos.</p>`;
  });
})();
