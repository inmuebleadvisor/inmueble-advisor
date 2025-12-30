import {
    collection,
    query,
    where,
    getDocs,
    doc,
    updateDoc,
    addDoc,
    serverTimestamp,
    arrayUnion,
    arrayRemove,
    getDoc,
    setDoc
} from 'firebase/firestore';

export class UserRepository {
    constructor(db) {
        this.db = db;
        this.collectionName = 'users';
    }

    async getAllUsers() {
        const snap = await getDocs(collection(this.db, this.collectionName));
        return snap.docs.map(d => ({ uid: d.id, ...d.data() }));
    }

    async getUserById(uid) {
        if (!uid) return null;
        const userRef = doc(this.db, this.collectionName, uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            return { uid: snap.id, ...snap.data() };
        }
        return null;
    }

    async findUserByEmail(email) {
        if (!email) return null;
        const q = query(collection(this.db, this.collectionName), where("email", "==", email));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const d = snap.docs[0];
            return { uid: d.id, ...d.data() };
        }
        return null;
    }

    async findUserByPhone(phone) {
        if (!phone) return null;
        const q = query(collection(this.db, this.collectionName), where("telefono", "==", phone));
        const snap = await getDocs(q);
        if (!snap.empty) {
            const d = snap.docs[0];
            return { uid: d.id, ...d.data() };
        }
        return null;
    }

    async createUser(userData) {
        const dataWithTimestamp = {
            ...userData,
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp()
        };
        const docRef = await addDoc(collection(this.db, this.collectionName), dataWithTimestamp);
        return { uid: docRef.id, ...dataWithTimestamp };
    }

    async createUserWithId(uid, userData) {
        const dataWithTimestamp = {
            ...userData,
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp()
        };
        await setDoc(doc(this.db, this.collectionName, uid), dataWithTimestamp);
        return { uid, ...dataWithTimestamp };
    }

    async updateUser(uid, updateData) {
        const userRef = doc(this.db, this.collectionName, uid);
        const dataWithTimestamp = {
            ...updateData,
            lastSeen: serverTimestamp()
        };
        await updateDoc(userRef, dataWithTimestamp);
        return true;
    }

    async addFavorite(uid, modeloId) {
        const userRef = doc(this.db, this.collectionName, uid);
        await updateDoc(userRef, {
            favoritos: arrayUnion(modeloId)
        });
        return true;
    }

    async removeFavorite(uid, modeloId) {
        const userRef = doc(this.db, this.collectionName, uid);
        await updateDoc(userRef, {
            favoritos: arrayRemove(modeloId)
        });
        return true;
    }

    async getFavorites(uid) {
        const userRef = doc(this.db, this.collectionName, uid);
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            return snap.data().favoritos || [];
        }
        return [];
    }
}
