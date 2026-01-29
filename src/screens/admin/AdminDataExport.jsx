import React, { useState } from 'react';
// ÚLTIMA MODIFICACION: 08/01/2026 - Refactor w/ Dependency Injection
import { useService } from '../../hooks/useService';
import { cleanField, parseCoordinate, parseDate, downloadCSV } from '../../utils/exportUtils';

/**
 * Componente AdminDataExport
 * --------------------------
 * Herramienta administrativa para descargar snapshots de Firestore a CSV.
 * Refactorizado para usar Service Layer y Utils comprtidos.
 */
const AdminDataExport = () => {
  const { admin } = useService();
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ msg: '', type: '' });

  // --- LÓGICA PRINCIPAL: DESARROLLOS ---

  const downloadDesarrollos = async () => {
    setLoading(true);
    setStatus({ msg: '⏳ Descargando Desarrollos... espera un momento.', type: 'info' });

    try {
      // 1. Petición a Service Layer (Lógica Desacoplada)
      const { headers, rows } = await admin.getDesarrollosExportData();

      // 2. Crear y descargar archivo
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
      // 1. Petición a Service Layer (Lógica Desacoplada)
      const { headers, rows } = await admin.getModelosExportData();

      // 2. Descargar
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