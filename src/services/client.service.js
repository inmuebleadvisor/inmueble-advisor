import { db } from '../firebase/config';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';

/**
 * SERVICIO DE GESTIÓN DE CLIENTES (Lead-User Link)
 * -----------------------------------------------
 * Responsabilidad:
 * - Garantizar que cada Lead esté vinculado a una entidad "User".
 * - Evitar duplicidad de usuarios basada en Email o Teléfono.
 */

// Normalizar teléfono para búsqueda (eliminar espacios, guiones)
const normalizePhone = (phone) => {
    return phone.replace(/\D/g, '').slice(-10); // Últimos 10 dígitos
};

/**
 * Busca un cliente existente por Email o Teléfono.
 * Prioridad: 1. Email (Exacto), 2. Teléfono (Normalizado).
 * @returns {Promise<{uid: string, ...data} | null>}
 */
export const findClientByContact = async (email, phone) => {
    const usersRef = collection(db, "users");

    // 1. Buscar por Email
    if (email) {
        const qEmail = query(usersRef, where("email", "==", email));
        const emailSnap = await getDocs(qEmail);
        if (!emailSnap.empty) {
            const doc = emailSnap.docs[0];
            return { uid: doc.id, ...doc.data() };
        }
    }

    // 2. Buscar por Teléfono (Si no se encontró por email)
    // Nota: Esto es más delicado porque el formato puede variar.
    // Asumimos que el backend/frontend guarda formato limpio, o buscamos por el input exacto por ahora.
    if (phone) {
        const qPhone = query(usersRef, where("telefono", "==", phone));
        const phoneSnap = await getDocs(qPhone);
        if (!phoneSnap.empty) {
            const doc = phoneSnap.docs[0];
            return { uid: doc.id, ...doc.data() };
        }
    }

    return null;
};

/**
 * Crea un nuevo Usuario con rol "cliente".
 * NOTA: Esto crea un "Ghost User" si no está autenticado. 
 * Si luego se registra con Google, el UID será diferente y habrá que fusionar (Fase futura).
 * Por ahora, esto cumple el requisito de tener un registro único de contacto.
 */
export const createClient = async (userData) => {
    try {
        const newUser = {
            nombre: userData.nombre,
            email: userData.email,
            telefono: userData.telefono,
            role: 'cliente',
            fechaRegistro: new Date().toISOString(),
            origen: 'web_lead_form',
            onboardingCompleto: false,
            // Metadatos de auditoría
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp()
        };

        const docRef = await addDoc(collection(db, "users"), newUser);
        return { uid: docRef.id, ...newUser };
    } catch (error) {
        console.error("Error creating client:", error);
        throw error;
    }
};

/**
 * Actualiza los datos de contacto de un cliente existente si son más recientes.
 */
export const updateClientContact = async (uid, newData) => {
    try {
        const userRef = doc(db, "users", uid);
        await updateDoc(userRef, {
            ...newData,
            lastSeen: serverTimestamp()
        });
    } catch (error) {
        console.error("Error updating client:", error);
        // No lanzamos error para no bloquear el flujo principal (Lead Creation)
    }
};
