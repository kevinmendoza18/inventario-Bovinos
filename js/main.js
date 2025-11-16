// Código JavaScript completo corregido según tus tablas con 7 filas

let comprasTemp = { hembras: [0,0,0,0,0,0,0], machos: [0,0,0,0,0,0,0] };
let ventasTemp = { hembras: [0,0,0,0,0,0,0], machos: [0,0,0,0,0,0,0] };

function getRows(tablaId) {
  return document.querySelectorAll(`#${tablaId} tbody tr`);
}

function actualizarTotales(tablaId, totalId, tipo) {
  const filas = getRows(tablaId);
  let totalGeneral = 0;

  filas.forEach((fila, idx) => {
    fila.querySelector('.compras').value = comprasTemp[tipo][idx] || 0;
    fila.querySelector('.ventas').value = ventasTemp[tipo][idx] || 0;

    const total = Math.max((comprasTemp[tipo][idx] || 0) - (ventasTemp[tipo][idx] || 0), 0);
    fila.querySelector('.total').textContent = total;

    totalGeneral += total;
  });

  document.getElementById(totalId).textContent = totalGeneral;
  return totalGeneral;
}

function actualizarTotalesGenerales() {
  const totalHembras = actualizarTotales('tabla-hembras', 'total-hembras', 'hembras');
  const totalMachos = actualizarTotales('tabla-machos', 'total-machos', 'machos');
  const totalGeneral = totalHembras + totalMachos;

  document.getElementById('mostrar-hembras').textContent = totalHembras;
  document.getElementById('mostrar-machos').textContent = totalMachos;
  document.getElementById('total-general').textContent = totalGeneral;
}

function guardarInventario() {
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

  localStorage.setItem('inventarioBovinos', JSON.stringify(datos));
  alert('✅ Inventario guardado correctamente.');
}

function cargarInventario() {
  const datos = JSON.parse(localStorage.getItem('inventarioBovinos'));

  if (!datos) {
    comprasTemp.hembras = [0,0,0,0,0,0,0];
    comprasTemp.machos = [0,0,0,0,0,0,0];
    ventasTemp.hembras = [0,0,0,0,0,0,0];
    ventasTemp.machos = [0,0,0,0,0,0,0];
    actualizarTotalesGenerales();
    return;
  }

  datos.hembras.forEach((fila, i) => {
    comprasTemp.hembras[i] = fila.compras || 0;
    ventasTemp.hembras[i] = fila.ventas || 0;
  });

  datos.machos.forEach((fila, i) => {
    comprasTemp.machos[i] = fila.compras || 0;
    ventasTemp.machos[i] = fila.ventas || 0;
  });

  actualizarTotalesGenerales();
}

function resetearInventario() {
  if (confirm('¿Seguro que deseas reiniciar el inventario?')) {
    localStorage.removeItem('inventarioBovinos');

    comprasTemp.hembras = [0,0,0,0,0,0,0];
    comprasTemp.machos = [0,0,0,0,0,0,0];
    ventasTemp.hembras = [0,0,0,0,0,0,0];
    ventasTemp.machos = [0,0,0,0,0,0,0];

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

// ------------------ EVENTOS PRINCIPALES ------------------
window.addEventListener('DOMContentLoaded', () => {
  cargarInventario();
  actualizarTotalesGenerales();

  // Botones de agregar compras/ventas
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

  // ----------- REGISTRO DE GUÍAS -----------
  const tablaRegistro = document.getElementById("tabla-registro").querySelector("tbody");

  document.getElementById("btn-agregar-registro").addEventListener("click", () => {
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

  tablaRegistro.addEventListener("click", function(e) {
    if (e.target.classList.contains("eliminar-registro"))
      e.target.closest("tr").remove();
  });

  document.getElementById("btn-guardar-registro").addEventListener("click", () => {
    let filas = tablaRegistro.querySelectorAll("tr");
    let datos = [];

    filas.forEach(tr => {
      datos.push(Array.from(tr.querySelectorAll("input")).map(inp => inp.value));
    });

    localStorage.setItem("registroGuias", JSON.stringify(datos));
    alert("✅ Registro de guías guardado.");
  });

  document.getElementById("btn-limpiar-registro").addEventListener("click", () => {
    tablaRegistro.innerHTML = "";
  });

  // ----------- NACIMIENTOS -----------
  const tablaNacimientos = document.getElementById("tabla-nacimientos").querySelector("tbody");

  document.getElementById("btn-agregar-nacimiento").addEventListener("click", () => {
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

  tablaNacimientos.addEventListener("click", function(e) {
    if (e.target.classList.contains("eliminar-nacimiento"))
      e.target.closest("tr").remove();
  });

  document.getElementById("btn-guardar-nacimiento").addEventListener("click", () => {
    let filas = tablaNacimientos.querySelectorAll("tr");
    let datos = [];

    filas.forEach(tr => {
      datos.push(Array.from(tr.querySelectorAll("input")).map(inp => inp.value));
    });

    localStorage.setItem("registroNacimientos", JSON.stringify(datos));
    alert("✅ Nacimientos guardados.");
  });

  document.getElementById("btn-limpiar-nacimiento").addEventListener("click", () => {
    tablaNacimientos.innerHTML = "";
  });
});

// ----------- BOTONES GENERALES -----------
document.getElementById('btn-guardar-inventario').addEventListener('click', guardarInventario);
document.getElementById('btn-reset-inventario').addEventListener('click', resetearInventario);
document.getElementById('btn-descargar-inventario').addEventListener('click', descargarExcel);

// ----------- MENÚ LATERAL -----------
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

    if (window.innerWidth < 991) {
      sidebar.classList.remove('active');
      overlay.classList.remove('active');
    }
  });
});
