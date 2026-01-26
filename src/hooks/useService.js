
import { useServiceContext } from '../context/ServiceContext';

/**
 * Hook to access services from the DI container.
 * Usage: const { crm, auth } = useService();
 * @returns {import('../services/service.provider').services}
 */
export const useService = () => {
    return useServiceContext();
};
