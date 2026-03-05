import { useState, useCallback, useEffect } from 'react';
import { useService } from './useService';

export const useMortgageSimulator = () => {
    const { mortgageSimulator } = useService();
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState(null);
    const [errorMessages, setErrorMessages] = useState([]);

    const simulate = useCallback(async (propertyPrice, downPayment, termYears) => {
        setIsLoading(true);
        setErrorMessages([]);
        try {
            const simulation = mortgageSimulator.getSimulation(propertyPrice, downPayment, termYears);

            if (simulation.error) {
                setErrorMessages(simulation.messages);
            } else {
                setResult(simulation);
            }
        } catch (err) {
            console.error("Simulation error: ", err);
            setErrorMessages(["Ocurrió un error interno al realizar la simulación."]);
        } finally {
            setIsLoading(false);
        }
    }, [mortgageSimulator]);

    return {
        simulate,
        isLoading,
        result,
        errorMessages
    };
};
