import { useState, useEffect } from 'react';
import { getAllDesarrollos, getAllLeads, getAllUsers } from '../services/admin.service';

/**
 * Hook para centralizar la obtención de datos del Dashboard Admin.
 * @returns {Object} { data: { users, leads, desarrollos }, loading, error, refresh }
 */
export const useAdminData = () => {
    const [data, setData] = useState({
        users: [],
        leads: [],
        desarrollos: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const [usersData, leadsData, devData] = await Promise.all([
                getAllUsers(),
                getAllLeads(),
                getAllDesarrollos()
            ]);

            setData({
                users: usersData,
                leads: leadsData,
                desarrollos: devData
            });
        } catch (err) {
            console.error("Error fetching admin data:", err);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    return { data, loading, error, refresh: fetchData };
};
