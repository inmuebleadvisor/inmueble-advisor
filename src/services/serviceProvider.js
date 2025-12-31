
import { db, auth, googleProvider } from '../firebase/config';

// Repositories
import { LeadRepository } from '../repositories/lead.repository';
import { UserRepository } from '../repositories/user.repository';
import { ExternalAdvisorRepository } from '../repositories/externalAdvisor.repository';

// Services
import { ConfigService } from './config.service';
import { CatalogService } from './catalog.service'; // Assuming it's already a class
import { AuthService } from './auth.service';
import { ExternalAdvisorService } from './externalAdvisor.service';
import { ClientService } from './client.service';
import { CrmService } from './crm.service';
import { LeadAssignmentService } from './leadAssignmentService';
import { FavoritesService } from './favorites.service';

// 1. Instantiate Repositories
import { CatalogRepository } from '../repositories/catalog.repository';

const leadRepository = new LeadRepository(db);
const userRepository = new UserRepository(db);
const externalAdvisorRepository = new ExternalAdvisorRepository(db);
const catalogRepository = new CatalogRepository(db);

// 2. Instantiate Services (Injecting Dependencies)
// Legacy services that accepted db directly
export const configService = new ConfigService(db);
// Refactor CatalogService to use the shared repo or keep as is?
// CatalogService creates its own repo inside. 
// For minimal friction, we leave CatalogService as is, but we use 'catalogRepository' for ExternalAdvisorService.
export const catalogService = new CatalogService(db);

// New Refactored Services
export const authService = new AuthService(auth, googleProvider, userRepository);
export const externalAdvisorService = new ExternalAdvisorService(externalAdvisorRepository, catalogRepository);
export const clientService = new ClientService(userRepository);
export const crmService = new CrmService(leadRepository, externalAdvisorService);
export const leadAssignmentService = new LeadAssignmentService(leadRepository, clientService);
export const favoritesService = new FavoritesService(userRepository);

// 3. Export Registry
export const services = {
    config: configService,
    catalog: catalogService,
    auth: authService,
    externalAdvisor: externalAdvisorService,
    client: clientService,
    crm: crmService,
    leadAssignment: leadAssignmentService,
    favorites: favoritesService
};
