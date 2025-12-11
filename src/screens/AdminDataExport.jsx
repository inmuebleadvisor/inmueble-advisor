import React, { useState } from 'react';
// ÚLTIMA MODIFICACION: 02/12/2025

// Asegúrate de que esta ruta apunte a tu configuración real de Firebase
import { db } from '../firebase/config';
import { collection, getDocs } from 'firebase/firestore';

/**
 * Componente AdminDataExport
 * --------------------------
 * Herramienta administrativa para descargar snapshots de Firestore a CSV.
 * Realiza limpieza de datos(Sanity Check) antes de exportar.
 */
const AdminDataExport = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // --- FUNCIONES DE LIMPIEZA DE DATOS (DATA CLEANING) ---

  /**
   * Prepara un campo para formato CSV.
   * - Convierte null/undefined a string vacío.
   * - Escapa las comillas dobles (") duplicándolas ("").
   * - Envuelve el texto en comillas para respetar espacios y comas internas.
   */
  const cleanField = (value) => {
    if (value === null || value === undefined) return '';
    const stringValue = String(value);
    // Reemplaza saltos de línea por espacios para no romper la fila del CSV
    const noNewLines = stringValue.replace(/(\r\n|\n|\r)/gm, " ");
    return `"${noNewLines.replace(/"/g, '""')}"`;
  };

  /**
   * Resuelve la inconsistencia del Schema (Latitud/Longitud String vs Number).
   * Intenta convertir a Float, si falla, devuelve el original para auditoría.
   */
  const parseCoordinate = (coord) => {
    if (!coord) return '';
    const num = parseFloat(coord);
    return isNaN(num) ? coord : num;
  };

  /**
   * Convierte un Timestamp de Firebase a fecha legible (YYYY-MM-DD).
   */
  const parseDate = (timestamp) => {
    if (timestamp && timestamp.toDate) {
      return timestamp.toDate().toISOString().split('T')[0];
    }
    return '';
  };

  // --- LÓGICA PRINCIPAL: DESARROLLOS ---

  const downloadDesarrollos = async () => {
    setLoading(true);
    setStatus({ msg: '⏳ Descargando Desarrollos... espera un momento.', type: 'info' });

    try {
      // 1. Petición a Firebase
      const querySnapshot = await getDocs(collection(db, "desarrollos"));

      // 2. Definición de Columnas (Headers)
      const headers = [
        "ID_Doc", "Nombre", "Status", "Precio Desde",
        "Latitud", "Longitud", // Aplanamos el mapa 'ubicacion'
        "Inventario", "Unidades Proyectadas", "Unidades Vendidas",
        "Fecha Entrega", "Keywords", "Amenidades"
      ];

      // 3. Mapeo de Documentos a Filas CSV
      const rows = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const ubicacion = data.ubicacion || {};

        // Convertimos arrays a strings separados por pipes (|)
        const amenidadesStr = Array.isArray(data.amenidades) ? data.amenidades.join(' | ') : '';
        const keywordsStr = Array.isArray(data.keywords) ? data.keywords.join(' | ') : '';

        return [
          cleanField(doc.id),
          cleanField(data.nombre),
          cleanField(data.status),
          cleanField(data.precios?.desde),
          cleanField(parseCoordinate(ubicacion.latitud)),
          cleanField(parseCoordinate(ubicacion.longitud)),
          cleanField(data.inventario),
          cleanField(data.unidades_proyectadas),
          cleanField(data.unidades_vendidas),
          cleanField(parseDate(data.fecha_entrega)),
          cleanField(keywordsStr),
          cleanField(amenidadesStr)
        ].join(',');
      });

      // 4. Crear y descargar archivo
      createAndDownloadCSV(headers, rows, 'BD_Desarrollos_Master.csv');
      setStatus({ msg: `✅ Éxito: ${rows.length} desarrollos descargados.`, type: 'success' });

    } catch (error) {
      console.error("Error:", error);
      setStatus({ msg: `❌ Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- LÓGICA PRINCIPAL: MODELOS ---

  const downloadModelos = async () => {
    setLoading(true);
    setStatus({ msg: '⏳ Descargando Modelos... esto puede tardar si hay muchos.', type: 'info' });

    try {
      const querySnapshot = await getDocs(collection(db, "modelos"));

      const headers = [
        "ID_Modelo", "ID_Desarrollo_Padre", "Nombre Modelo", "Nombre Desarrollo (Ref)",
        "Precio Lista", "Tipo Vivienda", "Es Preventa",
        "Recamaras", "Baños", "Niveles", "M2 Construccion", "M2 Terreno",
        "Latitud", "Longitud", "Amenidades"
      ];

      const rows = querySnapshot.docs.map(doc => {
        const data = doc.data();
        const ubicacion = data.ubicacion || {};
        const amenidadesStr = Array.isArray(data.amenidades) ? data.amenidades.join(' | ') : '';

        return [
          cleanField(doc.id),
          cleanField(data.id_desarrollo), // Clave foránea vital
          cleanField(data.nombreModelo),
          cleanField(data.nombreDesarrollo),
          cleanField(data.precios?.base),
          cleanField(data.tipoVivienda),
          cleanField(data.esPreventa ? 'SI' : 'NO'),
          cleanField(data.recamaras),
          cleanField(data.banos),
          cleanField(data.niveles),
          cleanField(data.m2),
          cleanField(data.terreno),
          cleanField(parseCoordinate(ubicacion.latitud)),
          cleanField(parseCoordinate(ubicacion.longitud)),
          cleanField(amenidadesStr)
        ].join(',');
      });

      createAndDownloadCSV(headers, rows, 'BD_Modelos_Master.csv');
      setStatus({ msg: `✅ Éxito: ${rows.length} modelos descargados.`, type: 'success' });

    } catch (error) {
      console.error("Error:", error);
      setStatus({ msg: `❌ Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // --- UTILIDAD DE GENERACIÓN DE ARCHIVO ---

  const createAndDownloadCSV = (headers, rows, fileName) => {
    const csvContent = [headers.join(','), ...rows].join('\n');

    // Agregamos \uFEFF (BOM) para que Excel reconozca acentos latinos correctamente
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });

    // Truco del elemento <a> invisible para forzar descarga
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- INTERFAZ DE USUARIO (UI) ---

  return (
    <div className="p-10 max-w-2xl mx-auto mt-10 bg-white shadow-xl rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Panel de Exportación DB</h2>
      <p className="text-gray-600 mb-6">
        Herramienta administrativa para descargar snapshots de Firestore a CSV.
      </p>

      {/* Botones de Acción */}
      <div className="flex flex-col gap-4">
        <button
          onClick={downloadDesarrollos}
          disabled={loading}
          className={`p-4 rounded-lg font-bold text-white transition-all 
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 shadow-md'}`}
        >
          {loading ? 'Procesando...' : '📥 Descargar CSV Desarrollos'}
        </button>

        <button
          onClick={downloadModelos}
          disabled={loading}
          className={`p-4 rounded-lg font-bold text-white transition-all 
            ${loading ? 'bg-gray-400 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 shadow-md'}`}
        >
          {loading ? 'Procesando...' : '📥 Descargar CSV Modelos'}
        </button>
      </div>

      {/* Área de Status / Feedback */}
      {status.msg && (
        <div className={`mt-6 p-4 rounded border ${status.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
          atus.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
            'bblue-50 border-blue-200 text-blue-700'
          }`}>
          <strong>Status:</strong> {status.msg}
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400">
        Inmueble Advisor Web - Internal Tool v1.0
      </div>
    </div>
  );
};

export default AdminDataExport;