import { db } from '../firebase/config';
import { CatalogService } from './catalog.service';
import { ConfigService } from './config.service';

// Singleton Instances
export const configService = new ConfigService(db);
export const catalogService = new CatalogService(db);

// Optional: Service Registry Object if needed for dynamic injection later
export const services = {
    config: configService,
    catalog: catalogService
};
