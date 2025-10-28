/* main.js
  - Dos tablas fijas: Hembras y Machos (mismas categorías)
  - Columns: Descripción | Compras | Nacimientos | Ventas | Total Existentes
  - + / - inline en cada campo
  - Agregar categoría (aplica a ambas tablas)
  - Guardado automático en localStorage
  - Exportar Excel (ambas tablas + resumen)
*/

(() => {
  const LS_KEY = 'inv_bovinos_v2';

  const defaultRows = [
    '0 a 3 meses',
    '3 a 9 meses',
    '9 a 12 meses',
    '1 a 2 años',
    '2 a 3 años',
    'Mayor de 3 años'
  ];

  // state: arrays for Hembras and Machos, each element: {descripcion, compra_acum, nac_acum, ventas_acum}
  let state = { Hembras: [], Machos: [] };

  // DOM refs
  const tablaH = document.getElementById('tablaHembras');
  const tablaM = document.getElementById('tablaMachos');
  const totalHCell = document.getElementById('totalHembras');
  const totalMCell = document.getElementById('totalMachos');
  const resH = document.getElementById('resHembras');
  const resM = document.getElementById('resMachos');
  const resT = document.getElementById('resTotal');
  const addCategoryBtn = document.getElementById('addCategory');
  const exportBtn = document.getElementById('exportBtn');

  // ---------- Storage ----------
  function loadState() {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed.Hembras && parsed.Machos) {
          state = parsed;
          return;
        }
      } catch (e) { console.warn('Error parse LS, resetting'); }
    }
    // init default
    state.Hembras = defaultRows.map(d => ({ descripcion: d, compra_acum: 0, nac_acum: 0, ventas_acum: 0 }));
    state.Machos = defaultRows.map(d => ({ descripcion: d, compra_acum: 0, nac_acum: 0, ventas_acum: 0 }));
    saveState();
  }

  function saveState() {
    localStorage.setItem(LS_KEY, JSON.stringify(state));
  }

  // ---------- Render ----------
  function buildControl(grupo, rowIndex, field) {
    // field: 'compra' | 'nac' | 'venta'
    const container = document.createElement('div');
    container.className = 'inline-control';

    const btnMinus = document.createElement('button');
    btnMinus.type = 'button';
    btnMinus.className = 'spin-btn';
    btnMinus.textContent = '−';

    const input = document.createElement('input');
    input.type = 'number';
    input.min = 0;
    input.value = '0';

    const btnPlus = document.createElement('button');
    btnPlus.type = 'button';
    btnPlus.className = 'spin-btn';
    btnPlus.textContent = '+';

    container.appendChild(btnMinus);
    container.appendChild(input);
    container.appendChild(btnPlus);

    const item = state[grupo][rowIndex];

    if (field === 'compra') {
      input.value = item.compra_acum;
      input.setAttribute('data-acum', item.compra_acum);
    } else if (field === 'nac') {
      input.value = item.nac_acum;
      input.setAttribute('data-acum', item.nac_acum);
    } else {
      input.value = 0; // ventas es transaccional
    }

    // plus
    btnPlus.addEventListener('click', () => {
      if (field === 'venta') {
        item.ventas_acum = (parseInt(item.ventas_acum) || 0) + 1;
        input.value = 0;
      } else {
        const key = field === 'compra' ? 'compra_acum' : 'nac_acum';
        item[key] = (parseInt(item[key]) || 0) + 1;
        input.value = item[key];
        input.setAttribute('data-acum', item[key]);
      }
      recalcAndSave();
    });

    // minus
    btnMinus.addEventListener('click', () => {
      if (field === 'venta') {
        item.ventas_acum = Math.max(0, (parseInt(item.ventas_acum) || 0) - 1);
        input.value = 0;
      } else {
        const key = field === 'compra' ? 'compra_acum' : 'nac_acum';
        item[key] = Math.max(0, (parseInt(item[key]) || 0) - 1);
        input.value = item[key];
        input.setAttribute('data-acum', item[key]);
      }
      recalcAndSave();
    });

    // manual input
    input.addEventListener('input', () => {
      const v = parseInt(input.value) || 0;
      if (field === 'venta') {
        if (v > 0) {
          item.ventas_acum = (parseInt(item.ventas_acum) || 0) + v;
          input.value = 0;
          recalcAndSave();
        }
      } else {
        const key = field === 'compra' ? 'compra_acum' : 'nac_acum';
        item[key] = Math.max(0, v);
        input.value = item[key];
        input.setAttribute('data-acum', item[key]);
        recalcAndSave();
      }
    });

    return container;
  }

  function renderTable(grupo, tableEl) {
    const tbody = tableEl.querySelector('tbody');
    tbody.innerHTML = '';
    state[grupo].forEach((row, idx) => {
      const tr = document.createElement('tr');

      const tdDesc = document.createElement('td');
      tdDesc.textContent = row.descripcion;

      const tdCompra = document.createElement('td');
      tdCompra.appendChild(buildControl(grupo, idx, 'compra'));

      const tdNac = document.createElement('td');
      tdNac.appendChild(buildControl(grupo, idx, 'nac'));

      const tdVenta = document.createElement('td');
      tdVenta.appendChild(buildControl(grupo, idx, 'venta'));

      const tdTotal = document.createElement('td');
      tdTotal.className = 'cell-total';
      tdTotal.textContent = '0';

      tr.appendChild(tdDesc);
      tr.appendChild(tdCompra);
      tr.appendChild(tdNac);
      tr.appendChild(tdVenta);
      tr.appendChild(tdTotal);

      tbody.appendChild(tr);
    });
  }

  // ---------- Calculations ----------
  function calcularTotalesTabla(grupo, tableEl, totalCell) {
    let total = 0;
    const rows = tableEl.tBodies[0].rows;
    for (let i = 0; i < rows.length; i++) {
      const item = state[grupo][i];
      const comp = parseInt(item.compra_acum) || 0;
      const nac = parseInt(item.nac_acum) || 0;
      const ventas = parseInt(item.ventas_acum) || 0;
      const filaTotal = Math.max(0, comp + nac - ventas);
      rows[i].querySelector('.cell-total').textContent = filaTotal;
      total += filaTotal;
    }
    totalCell.textContent = total;
    return total;
  }

  function recalcAndSave() {
    const th = calcularTotalesTabla('Hembras', tablaH, totalHCell);
    const tm = calcularTotalesTabla('Machos', tablaM, totalMCell);
    resH.textContent = th;
    resM.textContent = tm;
    resT.textContent = th + tm;
    saveState();
  }

  // ---------- Add category to both ----------
  addCategoryBtn.addEventListener('click', () => {
    const desc = prompt('Ingrese la descripción de la nueva categoría (aparecerá en Hembras y Machos):');
    if (!desc) return;
    state.Hembras.push({ descripcion: desc, compra_acum: 0, nac_acum: 0, ventas_acum: 0 });
    state.Machos.push({ descripcion: desc, compra_acum: 0, nac_acum: 0, ventas_acum: 0 });
    renderAll();
    recalcAndSave();
  });

  // ---------- Export to Excel ----------
  exportBtn.addEventListener('click', () => {
    const wb = XLSX.utils.book_new();

    // Hembras sheet
    const rowsH = [['Descripción','Compras acumuladas','Nacimientos acumulados','Ventas aplicadas','Total existentes']];
    state.Hembras.forEach(r => {
      const comp = r.compra_acum || 0;
      const nac = r.nac_acum || 0;
      const vent = r.ventas_acum || 0;
      const tot = Math.max(0, comp + nac - vent);
      rowsH.push([r.descripcion, comp, nac, vent, tot]);
    });
    rowsH.push(['TOTAL HEMBRAS', '', '', '', document.getElementById('totalHembras').textContent || '0']);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rowsH), 'Hembras');

    // Machos sheet
    const rowsM = [['Descripción','Compras acumuladas','Nacimientos acumulados','Ventas aplicadas','Total existentes']];
    state.Machos.forEach(r => {
      const comp = r.compra_acum || 0;
      const nac = r.nac_acum || 0;
      const vent = r.ventas_acum || 0;
      const tot = Math.max(0, comp + nac - vent);
      rowsM.push([r.descripcion, comp, nac, vent, tot]);
    });
    rowsM.push(['TOTAL MACHOS', '', '', '', document.getElementById('totalMachos').textContent || '0']);
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rowsM), 'Machos');

    // Resumen
    const resumen = [
      ['Total Hembras','Total Machos','Total General'],
      [ document.getElementById('totalHembras').textContent || '0', document.getElementById('totalMachos').textContent || '0', document.getElementById('resTotal').textContent || '0' ]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(resumen), 'Resumen');

    XLSX.writeFile(wb, 'Inventario_Bovinos.xlsx');
  });

  // ---------- Render everything ----------
  function renderAll() {
    renderTable('Hembras', tablaH);
    renderTable('Machos', tablaM);
  }

  // ---------- Init ----------
  loadState();
  renderAll();
  // ensure totals nodes exist in DOM (some index variants)
  recalcAndSave();

  // expose state for debug (optional)
  window._inv_bovinos = state;
})();
