
import React, { createContext, useContext } from 'react';
import { services } from '../services/service.provider';

const ServiceContext = createContext(null);

export const ServiceProvider = ({ children, overrideServices }) => {
    // overrideServices allows mocking for integration tests or storybook
    const value = overrideServices || services;

    return (
        <ServiceContext.Provider value={value}>
            {children}
        </ServiceContext.Provider>
    );
};

export const useServiceContext = () => {
    const context = useContext(ServiceContext);
    if (!context) {
        throw new Error("useServiceContext must be used within a ServiceProvider");
    }
    return context;
};
