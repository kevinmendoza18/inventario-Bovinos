// ====== CONFIGURACIÓN DE ESTADO EN MEMORIA ======
let comprasTemp = { hembras: [0,0,0,0,0,0,0], machos: [0,0,0,0,0,0,0] };
let ventasTemp  = { hembras: [0,0,0,0,0,0,0], machos: [0,0,0,0,0,0,0] };

// Claves base de localStorage
const LS_PREDIOS          = 'prediosInventario';
const LS_PREDIO_ACTIVO    = 'predioActivoInventario';
const LS_INVENTARIOS      = 'inventariosPorPredio';
const LS_REGISTRO_PREFIX  = 'registroGuias_';
const LS_NAC_PREFIX       = 'registroNacimientos_';

// ====== UTILIDADES DE PREDIOS (LOCALSTORAGE) ======
function obtenerPredios() {
  const data = localStorage.getItem(LS_PREDIOS);
  return data ? JSON.parse(data) : [];
}

function guardarPredios(lista) {
  localStorage.setItem(LS_PREDIOS, JSON.stringify(lista));
}

function obtenerInventariosPorPredio() {
  const data = localStorage.getItem(LS_INVENTARIOS);
  return data ? JSON.parse(data) : {};
}

function guardarInventariosPorPredio(obj) {
  localStorage.setItem(LS_INVENTARIOS, JSON.stringify(obj));
}

function obtenerPredioActivo() {
  return localStorage.getItem(LS_PREDIO_ACTIVO) || null;
}

function guardarPredioActivo(nombre) {
  localStorage.setItem(LS_PREDIO_ACTIVO, nombre);
}

// ====== MANEJO DE TABLAS INVENTARIO ======
function getRows(tablaId) {
  return document.querySelectorAll(`#${tablaId} tbody tr`);
}

function actualizarTotales(tablaId, totalId, tipo) {
  const filas = getRows(tablaId);
  let totalGeneral = 0;

  filas.forEach((fila, idx) => {
    fila.querySelector('.compras').value = comprasTemp[tipo][idx] || 0;
    fila.querySelector('.ventas').value  = ventasTemp[tipo][idx]  || 0;
    const total = Math.max((comprasTemp[tipo][idx] || 0) - (ventasTemp[tipo][idx] || 0), 0);
    fila.querySelector('.total').textContent = total;
    totalGeneral += total;
  });

  document.getElementById(totalId).textContent = totalGeneral;
  return totalGeneral;
}

function actualizarTotalesGenerales() {
  const totalHembras = actualizarTotales('tabla-hembras', 'total-hembras', 'hembras');
  const totalMachos  = actualizarTotales('tabla-machos',  'total-machos',  'machos');
  const totalGeneral = totalHembras + totalMachos;

  document.getElementById('mostrar-hembras').textContent = totalHembras;
  document.getElementById('mostrar-machos').textContent  = totalMachos;
  document.getElementById('total-general').textContent   = totalGeneral;
}

// ====== INVENTARIO POR PREDIO ======
function guardarInventario() {
  const predioActivo = obtenerPredioActivo();
  if (!predioActivo) {
    alert('Primero crea un predio y selecciónalo como activo.');
    return;
  }

  const datos = {
    hembras: comprasTemp.hembras.map((compra, i) => ({
      compras: compra,
      ventas: ventasTemp.hembras[i] || 0
    })),
    machos: comprasTemp.machos.map((compra, i) => ({
      compras: compra,
      ventas: ventasTemp.machos[i] || 0
    }))
  };

  const inventarios = obtenerInventariosPorPredio();
  inventarios[predioActivo] = datos;
  guardarInventariosPorPredio(inventarios);

  alert(`✅ Inventario guardado para el predio "${predioActivo}".`);
}

function cargarInventarioDePredio(predioNombre) {
  const inventarios = obtenerInventariosPorPredio();
  const datos = inventarios[predioNombre];

  if (!datos) {
    comprasTemp.hembras = [0,0,0,0,0,0,0];
    comprasTemp.machos  = [0,0,0,0,0,0,0];
    ventasTemp.hembras  = [0,0,0,0,0,0,0];
    ventasTemp.machos   = [0,0,0,0,0,0,0];
    actualizarTotalesGenerales();
    return;
  }

  comprasTemp.hembras = new Array(7).fill(0);
  comprasTemp.machos  = new Array(7).fill(0);
  ventasTemp.hembras  = new Array(7).fill(0);
  ventasTemp.machos   = new Array(7).fill(0);

  datos.hembras.forEach((fila, i) => {
    if (i < comprasTemp.hembras.length) {
      comprasTemp.hembras[i] = fila.compras || 0;
      ventasTemp.hembras[i]  = fila.ventas  || 0;
    }
  });

  datos.machos.forEach((fila, i) => {
    if (i < comprasTemp.machos.length) {
      comprasTemp.machos[i] = fila.compras || 0;
      ventasTemp.machos[i]  = fila.ventas  || 0;
    }
  });

  actualizarTotalesGenerales();
}

function resetearInventario() {
  const predioActivo = obtenerPredioActivo();
  if (!predioActivo) {
    alert('No hay predio activo. Crea uno primero.');
    return;
  }

  if (confirm(`¿Seguro que deseas reiniciar el inventario del predio "${predioActivo}"?`)) {
    const inventarios = obtenerInventariosPorPredio();
    delete inventarios[predioActivo];
    guardarInventariosPorPredio(inventarios);

    comprasTemp.hembras = [0,0,0,0,0,0,0];
    comprasTemp.machos  = [0,0,0,0,0,0,0];
    ventasTemp.hembras  = [0,0,0,0,0,0,0];
    ventasTemp.machos   = [0,0,0,0,0,0,0];
    document.querySelectorAll('.total').forEach(t => t.textContent = '0');
    actualizarTotalesGenerales();
  }
}

function descargarExcel() {
  const wb = XLSX.utils.book_new();
  ['tabla-hembras', 'tabla-machos'].forEach((id, idx) => {
    const tabla = document.getElementById(id);
    const ws = XLSX.utils.table_to_sheet(tabla);
    XLSX.utils.book_append_sheet(wb, ws, idx === 0 ? 'Hembras' : 'Machos');
  });
  XLSX.writeFile(wb, 'Inventario_Bovinos.xlsx');
}

// ====== MANEJO DE PREDIOS (UI) ======
function refrescarSelectPredios() {
  const select = document.getElementById('select-predios');
  const spanActivo = document.getElementById('nombre-predio-activo');
  const predios = obtenerPredios();
  const activo  = obtenerPredioActivo();

  select.innerHTML = '';

  if (predios.length === 0) {
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = 'Sin predios';
    select.appendChild(opt);
    spanActivo.textContent = '—';
    return;
  }

  predios.forEach(nombre => {
    const opt = document.createElement('option');
    opt.value = nombre;
    opt.textContent = nombre;
    if (nombre === activo) opt.selected = true;
    select.appendChild(opt);
  });

  spanActivo.textContent = activo || predios[0];
}

function pedirNombrePredioInicial() {
  let nombre = '';
  while (!nombre) {
    nombre = prompt('Nombre del primer predio:');
    if (nombre === null) break;
    nombre = nombre.trim();
    if (!nombre) alert('Escribe un nombre para el predio.');
  }
  return nombre || null;
}

function agregarPredio() {
  let nombre = prompt('Nombre del nuevo predio:');
  if (!nombre) return;

  nombre = nombre.trim();
  if (!nombre) return;

  const predios = obtenerPredios();
  if (predios.includes(nombre)) {
    alert('Ya existe un predio con ese nombre.');
    return;
  }

  predios.push(nombre);
  guardarPredios(predios);

  const inventarios = obtenerInventariosPorPredio();
  inventarios[nombre] = {
    hembras: comprasTemp.hembras.map(() => ({ compras: 0, ventas: 0 })),
    machos:  comprasTemp.machos.map(()  => ({ compras: 0, ventas: 0 }))
  };
  guardarInventariosPorPredio(inventarios);

  guardarPredioActivo(nombre);
  refrescarSelectPredios();
  cargarInventarioDePredio(nombre);

  // Al crear un nuevo predio, su registro y nacimientos empiezan vacíos
  limpiarRegistroTablaSoloDOM();
  limpiarNacimientosTablaSoloDOM();
}

function eliminarPredio() {
  const predioActivo = obtenerPredioActivo();
  if (!predioActivo) {
    alert('No hay predio activo para eliminar.');
    return;
  }

  if (!confirm(`¿Seguro que deseas eliminar el predio "${predioActivo}" y todo su inventario, registros y nacimientos?`)) return;

  let predios = obtenerPredios();
  predios = predios.filter(p => p !== predioActivo);
  guardarPredios(predios);

  const inventarios = obtenerInventariosPorPredio();
  delete inventarios[predioActivo];
  guardarInventariosPorPredio(inventarios);

  // Eliminar también sus registros y nacimientos
  localStorage.removeItem(LS_REGISTRO_PREFIX + predioActivo);
  localStorage.removeItem(LS_NAC_PREFIX + predioActivo);

  if (predios.length > 0) {
    guardarPredioActivo(predios[0]);
    cargarInventarioDePredio(predios[0]);
    cargarRegistroGuias();
    cargarRegistroNacimientos();
  } else {
    localStorage.removeItem(LS_PREDIO_ACTIVO);
    comprasTemp.hembras = [0,0,0,0,0,0,0];
    comprasTemp.machos  = [0,0,0,0,0,0,0];
    ventasTemp.hembras  = [0,0,0,0,0,0,0];
    ventasTemp.machos   = [0,0,0,0,0,0,0];
    actualizarTotalesGenerales();
    limpiarRegistroTablaSoloDOM();
    limpiarNacimientosTablaSoloDOM();
  }

  refrescarSelectPredios();
}

function manejarCambioPredio() {
  const select = document.getElementById('select-predios');
  const nuevo = select.value;
  if (!nuevo) return;
  guardarPredioActivo(nuevo);
  document.getElementById('nombre-predio-activo').textContent = nuevo;
  cargarInventarioDePredio(nuevo);
  cargarRegistroGuias();
  cargarRegistroNacimientos();
}

// ====== REGISTRO: guardar / cargar por PREDIO ======
function claveRegistroActual() {
  const predio = obtenerPredioActivo();
  if (!predio) return null;
  return LS_REGISTRO_PREFIX + predio;
}

function claveNacimientosActual() {
  const predio = obtenerPredioActivo();
  if (!predio) return null;
  return LS_NAC_PREFIX + predio;
}

function cargarRegistroGuias() {
  const tablaRegistro = document.getElementById("tabla-registro").querySelector("tbody");
  const key = claveRegistroActual();
  if (!key) {
    tablaRegistro.innerHTML = "";
    return;
  }
  const dataStr = localStorage.getItem(key);
  if (!dataStr) {
    tablaRegistro.innerHTML = "";
    return;
  }
  let datos;
  try {
    datos = JSON.parse(dataStr);
  } catch {
    tablaRegistro.innerHTML = "";
    return;
  }
  tablaRegistro.innerHTML = "";
  datos.forEach(fila => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="date" class="form-control" value="${fila[0] || ''}"></td>
      <td><input class="form-control" value="${fila[1] || ''}"></td>
      <td><input class="form-control" value="${fila[2] || ''}"></td>
      <td><input class="form-control" value="${fila[3] || ''}"></td>
      <td><input class="form-control" value="${fila[4] || ''}"></td>
      <td><input class="form-control" value="${fila[5] || ''}"></td>
      <td><input class="form-control" value="${fila[6] || ''}"></td>
      <td><input class="form-control" value="${fila[7] || ''}"></td>
      <td><input type="number" class="form-control" min="0" value="${fila[8] || ''}"></td>
      <td><input type="number" class="form-control" min="0" value="${fila[9] || ''}"></td>
      <td><input type="number" class="form-control" min="0" value="${fila[10] || ''}"></td>
      <td><button class="btn btn-outline-danger btn-sm eliminar-registro" title="Eliminar fila">&times;</button></td>
    `;
    tablaRegistro.appendChild(tr);
  });
}

function cargarRegistroNacimientos() {
  const tablaNacimientos = document.getElementById("tabla-nacimientos").querySelector("tbody");
  const key = claveNacimientosActual();
  if (!key) {
    tablaNacimientos.innerHTML = "";
    return;
  }
  const dataStr = localStorage.getItem(key);
  if (!dataStr) {
    tablaNacimientos.innerHTML = "";
    return;
  }
  let datos;
  try {
    datos = JSON.parse(dataStr);
  } catch {
    tablaNacimientos.innerHTML = "";
    return;
  }
  tablaNacimientos.innerHTML = "";
  datos.forEach(fila => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="form-control" value="${fila[0] || ''}"></td>
      <td><input type="date" class="form-control" value="${fila[1] || ''}"></td>
      <td><input type="date" class="form-control" value="${fila[2] || ''}"></td>
      <td><input class="form-control" value="${fila[3] || ''}"></td>
      <td><input class="form-control" value="${fila[4] || ''}"></td>
      <td><button class="btn btn-outline-danger btn-sm eliminar-nacimiento" title="Eliminar fila">&times;</button></td>
    `;
    tablaNacimientos.appendChild(tr);
  });
}

function limpiarRegistroTablaSoloDOM() {
  const tablaRegistro = document.getElementById("tabla-registro").querySelector("tbody");
  tablaRegistro.innerHTML = "";
}

function limpiarNacimientosTablaSoloDOM() {
  const tablaNacimientos = document.getElementById("tabla-nacimientos").querySelector("tbody");
  tablaNacimientos.innerHTML = "";
}

// ====== INICIALIZACIÓN GENERAL ======
window.addEventListener('DOMContentLoaded', () => {
  // ----- Predios -----
  let predios = obtenerPredios();
  let activo  = obtenerPredioActivo();

  if (predios.length === 0) {
    const nombre = pedirNombrePredioInicial();
    if (nombre) {
      predios = [nombre];
      guardarPredios(predios);

      const inventarios = obtenerInventariosPorPredio();
      inventarios[nombre] = {
        hembras: comprasTemp.hembras.map(() => ({ compras: 0, ventas: 0 })),
        machos:  comprasTemp.machos.map(()  => ({ compras: 0, ventas: 0 }))
      };
      guardarInventariosPorPredio(inventarios);
      guardarPredioActivo(nombre);
      // registros / nacimientos quedan vacíos por defecto
    }
  }

  if (!activo && predios.length > 0) {
    activo = predios[0];
    guardarPredioActivo(activo);
  }

  refrescarSelectPredios();
  const predioParaCargar = obtenerPredioActivo();
  if (predioParaCargar) {
    cargarInventarioDePredio(predioParaCargar);
  } else {
    actualizarTotalesGenerales();
  }

  document.getElementById('btn-agregar-predio').addEventListener('click', agregarPredio);
  document.getElementById('btn-eliminar-predio').addEventListener('click', eliminarPredio);
  document.getElementById('select-predios').addEventListener('change', manejarCambioPredio);

  // ----- Eventos tablas inventario -----
  ['tabla-hembras', 'tabla-machos'].forEach((tabla, tipoIdx) => {
    let tipo = tabla === 'tabla-hembras' ? 'hembras' : 'machos';
    let filas = getRows(tabla);

    filas.forEach((fila, idx) => {
      fila.querySelector('.agregar-btn').addEventListener('click', () => {
        let sumar = parseInt(fila.querySelector('.comprar-agregar').value) || 0;
        if (sumar > 0) {
          comprasTemp[tipo][idx] += sumar;
          fila.querySelector('.comprar-agregar').value = "";
          actualizarTotalesGenerales();
        }
      });

      fila.querySelector('.ventas-btn').addEventListener('click', () => {
        let sumar = parseInt(fila.querySelector('.ventas-agregar').value) || 0;
        if (sumar > 0) {
          ventasTemp[tipo][idx] += sumar;
          fila.querySelector('.ventas-agregar').value = "";
          actualizarTotalesGenerales();
        }
      });
    });
  });

  // ----------- REGISTRO -----------
  const tablaRegistro = document.getElementById("tabla-registro").querySelector("tbody");
  cargarRegistroGuias();

  document.getElementById("btn-agregar-registro").addEventListener("click", ()=>{
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input type="date" class="form-control"></td>
      <td><input class="form-control"></td>
      <td><input class="form-control"></td>
      <td><input class="form-control"></td>
      <td><input class="form-control"></td>
      <td><input class="form-control"></td>
      <td><input class="form-control"></td>
      <td><input class="form-control"></td>
      <td><input type="number" class="form-control" min="0"></td>
      <td><input type="number" class="form-control" min="0"></td>
      <td><input type="number" class="form-control" min="0"></td>
      <td><button class="btn btn-outline-danger btn-sm eliminar-registro" title="Eliminar fila">&times;</button></td>
    `;
    tablaRegistro.appendChild(tr);
  });

  tablaRegistro.addEventListener("click", function(e){
    if (e.target.classList.contains("eliminar-registro"))
      e.target.closest("tr").remove();
  });

  document.getElementById("btn-guardar-registro").addEventListener("click", ()=>{
    const key = claveRegistroActual();
    if (!key) {
      alert('Primero selecciona un predio para guardar el registro.');
      return;
    }
    let filas = tablaRegistro.querySelectorAll("tr");
    let datos = [];
    filas.forEach(tr=>{
      datos.push(Array.from(tr.querySelectorAll("input")).map(inp=>inp.value));
    });
    localStorage.setItem(key, JSON.stringify(datos));
    alert("✅ Registro de guías guardado para este predio.");
  });

  document.getElementById("btn-limpiar-registro").addEventListener("click",()=>{
    limpiarRegistroTablaSoloDOM();
  });

  // ----------- NACIMIENTOS -----------
  const tablaNacimientos = document.getElementById("tabla-nacimientos").querySelector("tbody");
  cargarRegistroNacimientos();

  document.getElementById("btn-agregar-nacimiento").addEventListener("click", ()=>{
    let tr = document.createElement("tr");
    tr.innerHTML = `
      <td><input class="form-control"></td>
      <td><input type="date" class="form-control"></td>
      <td><input type="date" class="form-control"></td>
      <td><input class="form-control"></td>
      <td><input class="form-control"></td>
      <td><button class="btn btn-outline-danger btn-sm eliminar-nacimiento" title="Eliminar fila">&times;</button></td>
    `;
    tablaNacimientos.appendChild(tr);
  });

  tablaNacimientos.addEventListener("click", function(e){
    if (e.target.classList.contains("eliminar-nacimiento"))
      e.target.closest("tr").remove();
  });

  document.getElementById("btn-guardar-nacimiento").addEventListener("click", ()=>{
    const key = claveNacimientosActual();
    if (!key) {
      alert('Primero selecciona un predio para guardar los nacimientos.');
      return;
    }
    let filas = tablaNacimientos.querySelectorAll("tr");
    let datos = [];
    filas.forEach(tr=>{
      datos.push(Array.from(tr.querySelectorAll("input")).map(inp=>inp.value));
    });
    localStorage.setItem(key, JSON.stringify(datos));
    alert("✅ Nacimientos guardados para este predio.");
  });

  document.getElementById("btn-limpiar-nacimiento").addEventListener("click",()=>{
    limpiarNacimientosTablaSoloDOM();
  });
});

// ====== BOTONES GENERALES INVENTARIO ======
document.getElementById('btn-guardar-inventario').addEventListener('click', guardarInventario);
document.getElementById('btn-reset-inventario').addEventListener('click', resetearInventario);
document.getElementById('btn-descargar-inventario').addEventListener('click', descargarExcel);

// ====== MENÚ LATERAL / SECCIONES ======
const btnHamburger = document.getElementById('btn-hamburger');
const sidebar = document.getElementById('sidebar');
const overlay = document.getElementById('overlay');
const sectionLinks = document.querySelectorAll('#sidebar a');
const sections = document.querySelectorAll('.section');

btnHamburger.addEventListener('click', () => {
  sidebar.classList.toggle('active');
  overlay.classList.toggle('active');
});

overlay.addEventListener('click', () => {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
});

sectionLinks.forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    sectionLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
    const sectionId = link.getAttribute('data-section');
    sections.forEach(sec => {
      sec.classList.remove('active');
      if (sec.id === sectionId) sec.classList.add('active');
    });
    if(window.innerWidth < 991) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  });
});
