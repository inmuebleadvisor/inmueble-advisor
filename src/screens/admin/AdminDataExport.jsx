import React, { useState } from 'react';
// ÚLTIMA MODIFICACION: 31/12/2025 - Refactor w/ Services & Utils
import { getAllDesarrollos, getAllModelos } from '../../services/admin.service';
import { cleanField, parseCoordinate, parseDate, downloadCSV } from '../../utils/exportUtils';

/**
 * Componente AdminDataExport
 * --------------------------
 * Herramienta administrativa para descargar snapshots de Firestore a CSV.
 * Refactorizado para usar Service Layer y Utils comprtidos.
 */
const AdminDataExport = () => {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // --- LÓGICA PRINCIPAL: DESARROLLOS ---

  const downloadDesarrollos = async () => {
    setLoading(true);
    setStatus({ msg: '⏳ Descargando Desarrollos... espera un momento.', type: 'info' });

    try {
      // 1. Petición a Service Layer
      const docs = await getAllDesarrollos();

      // 2. Definición de Columnas (Headers vs DATOSESTRUCTURA.md)
      const headers = [
        "id",
        "nombre",
        "status",
        "constructora",
        "geografiaId", // FK Geo
        "ubicacion.calle",
        "ubicacion.colonia",
        "ubicacion.ciudad",
        "ubicacion.estado",
        "ubicacion.zona",
        "ubicacion.latitud",
        "ubicacion.longitud",
        "precios.desde", // Mapeado a precioDesde
        "stats.ofertaTotal",
        "stats.viviendasxVender",
        "infoComercial.fechaInicioVenta",
        "infoComercial.unidadesTotales",
        "infoComercial.unidadesVendidas",
        "infoComercial.unidadesDisponibles",
        "keywords",
        "caracteristicas.amenidades"
      ];

      // 3. Mapeo de Documentos a Filas CSV
      const rows = docs.map(data => {
        const ubicacion = data.ubicacion || {};
        const info = data.info_comercial || {}; // Adapting to model mapper 
        const stats = data.stats || {};
        const caracteristicas = data.caracteristicas || {};

        const amenidadesStr = Array.isArray(data.amenidades) ? data.amenidades.join(' | ') : '';
        const keywordsStr = Array.isArray(data.keywords) ? data.keywords.join(' | ') : '';

        return [
          cleanField(data.id),
          cleanField(data.nombre),
          cleanField(data.active ? 'activo' : 'inactivo'), // Model maps 'activo' boolean
          cleanField(data.constructora),
          cleanField(data.geografiaId),
          cleanField(ubicacion.calle),
          cleanField(ubicacion.colonia),
          cleanField(ubicacion.ciudad),
          cleanField(ubicacion.estado),
          cleanField(data.zona || ubicacion.zona),
          cleanField(data.latitud), // Model already parses coord
          cleanField(data.longitud), // Model already parses coord
          cleanField(data.precioDesde),
          cleanField(stats.ofertaTotal),
          cleanField(stats.viviendasxVender),
          cleanField(parseDate(info.fechaInicioVenta)),
          cleanField(info.unidadesTotales),
          cleanField(info.unidadesVendidas),
          cleanField(info.unidadesDisponibles),
          cleanField(keywordsStr),
          cleanField(amenidadesStr)
        ].map(val => String(val)).join(','); // Ensure join works
      });

      // 4. Crear y descargar archivo
      downloadCSV(headers, rows, 'BD_Desarrollos_Master.csv');
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
      const docs = await getAllModelos();

      const headers = [
        "id",
        "idDesarrollo", // FK
        "nombreModelo",
        "nombreDesarrollo", // Ref
        "tipoVivienda",
        "esPreventa", // calc
        "precios.base",
        "precios.mantenimientoMensual",
        "recamaras",
        "banos",
        "niveles",
        "cajones",
        "specs.m2", // Flattened in model but schema says specs.m2? 
        // Wait, DATOSESTRUCTURA says "specs" root level has m2? No "specs: - m2". so specs.m2 or root m2?
        // Visual checking DATOSESTRUCTURA:
        // "| specs | - | - | Especificaciones directas (Root level). |"
        // "| m2 | number | Simple | Construcción. |"
        // It seems to imply they are root level fields conceptually grouped under specs in documentation.
        // Model mapper puts them at root: data.m2. 
        // Export will follow Model Mapper.
        "m2",
        "terreno",
        "frente",
        "fondo",
        "ubicacion.latitud",
        "ubicacion.longitud",
        "amenidades"
      ];

      const rows = docs.map(data => {
        // Model mapper flat structure
        const ubicacion = data.ubicacion || {};
        const amenidadesStr = Array.isArray(data.amenidades) ? data.amenidades.join(' | ') : '';

        return [
          cleanField(data.id),
          cleanField(data.idDesarrollo),
          cleanField(data.nombre_modelo), // Mapper uses nombre_modelo
          cleanField(data.nombreDesarrollo),
          cleanField(data.tipoVivienda),
          cleanField(data.esPreventa ? 'SI' : 'NO'),
          cleanField(data.precioNumerico), // Best proxy for active price
          cleanField(data.precios?.mantenimientoMensual),
          cleanField(data.recamaras),
          cleanField(data.banos),
          cleanField(data.niveles),
          cleanField(data.cajones),
          cleanField(data.m2),
          cleanField(data.terreno),
          cleanField(data.frente), // Model might not map this yet? Let's check Model.js. 
          // Model.js doesn't seem to map `frente` explicitly in the return object?
          // Checked `mapModelo`: `frente` is NOT in the return object!
          // This is a GAP found. I will map it if present in data, otherwise empty.
          cleanField(data.frente),
          cleanField(data.fondo),
          cleanField(data.latitud),
          cleanField(data.longitud),
          cleanField(amenidadesStr)
        ].map(val => String(val)).join(',');
      });

      downloadCSV(headers, rows, 'BD_Modelos_Master.csv');
      setStatus({ msg: `✅ Éxito: ${rows.length} modelos descargados.`, type: 'success' });

    } catch (error) {
      console.error("Error:", error);
      setStatus({ msg: `❌ Error: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-10 max-w-2xl mx-auto mt-10 bg-white shadow-xl rounded-lg border border-gray-200">
      <h2 className="text-2xl font-bold text-gray-800 mb-2">Panel de Exportación DB</h2>
      <p className="text-gray-600 mb-6">
        Herramienta administrativa para descargar snapshots de Firestore a CSV.
      </p>

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

      {status.msg && (
        <div className={`mt-6 p-4 rounded border ${status.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' :
          status.type === 'success' ? 'bg-green-50 border-green-200 text-green-700' :
            'bg-blue-50 border-blue-200 text-blue-700'
          }`}>
          <strong>Status:</strong> {status.msg}
        </div>
      )}

      <div className="mt-8 pt-4 border-t border-gray-100 text-xs text-gray-400">
        Inmueble Advisor Web - Internal Tool v1.1 (Refactored)
      </div>
    </div>
  );
};

export default AdminDataExport;