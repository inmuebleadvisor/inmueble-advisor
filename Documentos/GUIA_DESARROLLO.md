# 🛠️ Guía de Desarrollo - Inmueble Advisor

Esta guía describe el flujo de trabajo estándar para agregar nuevas funcionalidades siguiendo la arquitectura de **Servicios con Inyección de Dependencias (DI)** y **Repositorios**.

## 🏗️ Arquitectura en Capas

El backend (lógica) está desacoplado del frontend (React) mediante capas:

1.  **React (UI)**: Solo se preocupa por renderizar. Pide datos a través de `useServiceContext`.
2.  **Service Context**: Provee las instancias de los servicios.
3.  **Services (Lógica)**: Implementan las reglas de negocio. No tocan la DB directamente.
4.  **Repositories (Datos)**: Hablan con Firebase Firestore.

---

## 🚀 Flujo para Nueva Feature (Paso a Paso)

Si necesitas agregar una nueva funcionalidad que requiere datos (ej. "Gestión de Citas"), sigue estos 4 pasos:

### 1. Crear el Repositorio (Data Access)
Crea `src/repositories/appointment.repository.js`.
Solo métodos CRUD.

```javascript
/* src/repositories/appointment.repository.js */
import { collection, addDoc, getDocs } from 'firebase/firestore';

export class AppointmentRepository {
    constructor(db) {
        this.db = db;
        this.collectionName = 'citas';
    }

    async createAppointment(data) {
        return await addDoc(collection(this.db, this.collectionName), data);
    }
}
```

### 2. Crear el Servicio (Business Logic)
Crea `src/services/appointment.service.js`.
Recibe el repositorio en el constructor (Inyección).

```javascript
/* src/services/appointment.service.js */
export class AppointmentService {
    constructor(appointmentRepository) {
        this.repo = appointmentRepository;
    }

    async agendarCita(usuario, fecha) {
        // Validación de negocio
        if (!usuario.activo) throw new Error("Usuario inactivo");
        
        return await this.repo.createAppointment({
            uid: usuario.uid,
            fecha: fecha,
            status: 'PENDING'
        });
    }
}
```

### 3. Registrar en el Provider (Inyección)
Edita `src/services/serviceProvider.js`.
Instancia el repo y el servicio.

```javascript
/* src/services/serviceProvider.js */
// Imports
import { AppointmentRepository } from '../repositories/appointment.repository';
import { AppointmentService } from '../services/appointment.service';

// 1. Instanciar Repo
const appointmentRepo = new AppointmentRepository(db);

// 2. Instanciar Servicio (Inyectando Repo)
export const appointmentService = new AppointmentService(appointmentRepo);

// 3. Exportar en services object
export const services = {
    // ... otros
    appointments: appointmentService
};
```

### 4. Consumir en React
Usa el hook `useServiceContext`.

```javascript
/* src/components/AgendarCitaBtn.jsx */
import { useServiceContext } from '../context/ServiceContext';

export const AgendarCitaBtn = () => {
    const { appointments } = useServiceContext(); // Accede al servicio por nombre

    const handleAgendar = async () => {
        await appointments.agendarCita(currentUser, new Date());
    };

    return <button onClick={handleAgendar}>Agendar</button>;
};
```

---

## 🧪 Testing

Gracias a la inyección de dependencias, probar es muy fácil porque puedes **mockear** el repositorio.

```javascript
/* src/services/test_appointment.service.js */
import { AppointmentService } from './appointment.service';

// Mock del repositorio
const mockRepo = {
    createAppointment: async () => 'new-id-123'
};

const service = new AppointmentService(mockRepo);

// Test
test('Debe agendar cita correctamente', async () => {
    const id = await service.agendarCita({ activo: true }, new Date());
    console.assert(id === 'new-id-123');
});
```
