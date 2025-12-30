import React, { useState, useEffect } from 'react';
import { generarLeadAutomatico } from '../../services/leadAssignmentService';
import { useUser } from '../../context/UserContext'; // ✅ Contexto de Usuario
import '../../styles/LeadCaptureForm.css';

const LeadCaptureForm = ({ desarrollo, modelo, onSuccess, onCancel }) => {
    const { user, userProfile, loginWithGoogle } = useUser(); // ✅ Obtener usuario y login

    const [formData, setFormData] = useState({
        nombre: '',
        telefono: '',
        email: '',
        mensaje: `Hola, me interesa el modelo ${modelo?.nombre_modelo || ''} en ${desarrollo?.nombre || ''}.`
    });

    // 🔄 EFECTO: Pre-llenar datos si el usuario está logueado
    useEffect(() => {
        if (user && userProfile) {
            setFormData(prev => ({
                ...prev,
                nombre: userProfile.nombre || user.displayName || '',
                email: userProfile.email || user.email || '',
                telefono: userProfile.telefono || '' // Si ya lo tenemos guardado
            }));
        }
    }, [user, userProfile]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!formData.nombre || !formData.telefono) {
            setError("Nombre y teléfono son obligatorios");
            setLoading(false);
            return;
        }

        try {
            const result = await generarLeadAutomatico(
                {
                    nombre: formData.nombre,
                    telefono: formData.telefono,
                    email: formData.email
                },
                desarrollo?.id,
                desarrollo?.nombre,
                modelo?.nombre_modelo,
                user?.uid // ✅ PASAMOS EL UID GARANTIZADO
            );

            if (result.success) {
                if (onSuccess) onSuccess();
            } else {
                setError("Error al enviar: " + result.error);
            }
        } catch (err) {
            console.error(err);
            setError("Error inesperado. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    // 🔒 GATED CONTENT: REQUIRE LOGIN
    if (!user) {
        return (
            <div className="lead-form lead-form--gated">
                <h3 className="lead-form__title">Inicia Sesión</h3>
                <p className="lead-form__subtitle">
                    Para agendar una cita o cotizar, necesitamos verificar tu identidad.
                </p>
                <button
                    type="button"
                    className="lead-form__btn lead-form__btn--google"
                    onClick={async () => {
                        try { await loginWithGoogle(); } catch (e) { console.error(e); }
                    }}
                >
                    <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        alt="Google"
                        style={{ width: '20px', marginRight: '10px' }}
                    />
                    Continuar con Google
                </button>
                <div className="lead-form__actions">
                    <button type="button" className="lead-form__btn lead-form__btn--secondary" onClick={onCancel}>
                        Cancelar
                    </button>
                </div>
            </div>
        );
    }

    return (
        <form className="lead-form" onSubmit={handleSubmit}>
            <h3 className="lead-form__title">Confirmar Datos</h3>

            <div style={{
                background: '#f0fdf4', color: '#166534', padding: '10px', borderRadius: '6px',
                fontSize: '0.9rem', textAlign: 'center', border: '1px solid #bbf7d0', marginBottom: '1rem'
            }}>
                👤 Solicitando como: <strong>{user.displayName}</strong>
            </div>

            <p className="lead-form__subtitle">
                Recibe información detallada de <strong>{modelo?.nombre_modelo}</strong>.
            </p>

            {error && <div className="lead-form__error">{error}</div>}

            <div className="lead-form__group">
                <label className="lead-form__label" htmlFor="nombre">Nombre Completo</label>
                <input
                    type="text"
                    id="nombre"
                    name="nombre"
                    className="lead-form__input"
                    value={formData.nombre}
                    onChange={handleChange}
                    placeholder="Ej. Juan Pérez"
                />
            </div>

            <div className="lead-form__group">
                <label className="lead-form__label" htmlFor="telefono">Teléfono (WhatsApp)</label>
                <input
                    type="tel"
                    id="telefono"
                    name="telefono"
                    className="lead-form__input"
                    value={formData.telefono}
                    onChange={handleChange}
                    placeholder="Ej. 667 123 4567"
                />
            </div>

            <div className="lead-form__group">
                <label className="lead-form__label" htmlFor="email">Email (Verificado)</label>
                <input
                    type="email"
                    id="email"
                    name="email"
                    className="lead-form__input lead-form__input--readonly"
                    value={formData.email}
                    readOnly
                    disabled
                />
            </div>

            <div className="lead-form__actions">
                <button
                    type="button"
                    className="lead-form__btn lead-form__btn--secondary"
                    onClick={onCancel}
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    className="lead-form__btn lead-form__btn--primary"
                    disabled={loading}
                >
                    {loading ? 'Enviando...' : 'Solicitar Info'}
                </button>
            </div>

            <p className="lead-form__disclaimer">
                Al enviar, aceptas ser contactado por un asesor certificado.
            </p>
        </form>
    );
};

export default LeadCaptureForm;
