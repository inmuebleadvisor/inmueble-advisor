import React, { useState, useEffect, useMemo } from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { getAvailableSlots, getMaxScheduleDate } from '../../services/appointment.service';
import '../../index.css'; // Ensure variables are available

/**
 * AppointmentScheduler Component
 * Allows users to select a date and an available time slot.
 * 
 * @param {Object} props
 * @param {Function} props.onSelect - Callback ({ date: Date, time: string, timestamp: Date })
 * @param {Date} [props.initialDate] - Optional initial date
 * @param {string} [props.className] - Extra classes
 */
const AppointmentScheduler = ({ onSelect, initialDate, className = '' }) => {
    const [selectedDate, setSelectedDate] = useState(initialDate || new Date());
    const [selectedSlot, setSelectedSlot] = useState(null);
    // const [slots, setSlots] = useState([]); // REMOVED: Now derived via useMemo

    // Generate next 15 days for the calendar strip
    const calendarDays = useMemo(() => {
        const days = [];
        const maxDate = getMaxScheduleDate();
        let current = new Date();

        while (current <= maxDate) {
            days.push(new Date(current));
            current = addDays(current, 1);
        }
        return days;
    }, []);

    // Derived state for slots
    const slots = useMemo(() => getAvailableSlots(selectedDate), [selectedDate]);

    const handleDateSelect = (date) => {
        setSelectedDate(date);
        setSelectedSlot(null); // Reset selection when date changes
    };

    const handleSlotClick = (slot) => {
        if (!slot.available) return;
        setSelectedSlot(slot.value);
        if (onSelect) {
            onSelect({
                dia: slot.date, // Firestore Timestamp compatible (Date object)
                hora: slot.value // "14:00"
            });
        }
    };

    return (
        <div className={`w-full ${className}`}>

            {/* Header / Context */}
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm uppercase tracking-wider font-bold" style={{ color: 'var(--text-secondary)' }}>
                    Selecciona Fecha y Hora
                </h3>
                {selectedSlot && (
                    <span className="text-xs font-medium px-2 py-1 rounded-md bg-green-500/10 text-green-400 border border-green-500/20">
                        Cita Confirmada
                    </span>
                )}
            </div>

            {/* Date Selector (Horizontal Scroll) */}
            <div className="mb-6 relative group">
                {/* Scroll Container */}
                <div className="overflow-x-auto pb-4 flex gap-3 no-scrollbar scroll-smooth" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {calendarDays.map((date, index) => {
                        const isSelected = isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());

                        return (
                            <button
                                type="button"
                                key={index}
                                onClick={() => handleDateSelect(date)}
                                className={`
                                    flex flex-col items-center justify-center min-w-[72px] h-[90px] p-2 rounded-2xl border transition-all duration-300 ease-out flex-shrink-0 relative overflow-hidden
                                    ${isSelected
                                        ? 'shadow-[0_0_20px_-5px_var(--primary-color)] scale-105'
                                        : 'bg-white/5 border-white/10 hover:border-white/30 hover:bg-white/10'}
                                `}
                                style={{
                                    backgroundColor: isSelected ? 'var(--primary-color)' : undefined,
                                    borderColor: isSelected ? 'var(--primary-color)' : undefined,
                                }}
                            >
                                {/* Glow Effect for Selected */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent opacity-50" />
                                )}

                                <span className={`text-[10px] uppercase tracking-widest font-bold mb-1 z-10 ${isSelected ? 'text-black' : 'text-[var(--text-secondary)]'}`}>
                                    {isToday ? 'HOY' : format(date, 'EEE', { locale: es })}
                                </span>
                                <span className={`text-2xl font-black z-10 ${isSelected ? 'text-black' : 'text-[var(--text-main)]'}`}>
                                    {format(date, 'd')}
                                </span>
                                <span className={`text-[10px] uppercase z-10 ${isSelected ? 'text-black/70' : 'text-[var(--text-secondary)]'}`}>
                                    {format(date, 'MMM', { locale: es })}
                                </span>
                            </button>
                        );
                    })}
                </div>
                {/* Fade indicators for scroll */}
                <div className="absolute right-0 top-0 bottom-4 w-12 bg-gradient-to-l from-[var(--bg-secondary)] to-transparent pointer-events-none" />
            </div>

            {/* Time Slots Grid */}
            <div className="space-y-3">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                    {slots.length > 0 ? (
                        slots.map((slot, idx) => {
                            const isSelected = selectedSlot === slot.value;
                            return (
                                <button
                                    type="button"
                                    key={idx}
                                    disabled={!slot.available}
                                    onClick={() => handleSlotClick(slot)}
                                    className={`
                                        relative px-1 py-3 rounded-full text-xs font-bold border transition-all duration-200 group
                                        ${!slot.available
                                            ? 'opacity-30 grayscale cursor-not-allowed border-transparent bg-white/5 text-[var(--text-secondary)]'
                                            : 'cursor-pointer'}
                                        ${isSelected
                                            ? 'ring-2 ring-offset-2 ring-offset-[var(--bg-secondary)] ring-[var(--primary-color)]'
                                            : 'hover:border-[var(--primary-color)] hover:text-[var(--primary-color)]'}
                                    `}
                                    style={{
                                        backgroundColor: isSelected ? 'var(--primary-color)' : (!slot.available ? undefined : 'transparent'),
                                        borderColor: isSelected ? 'var(--primary-color)' : (!slot.available ? 'transparent' : 'var(--border-subtle)'),
                                        color: isSelected ? '#000' : (slot.available ? 'var(--text-main)' : 'var(--text-secondary)'),
                                        boxShadow: isSelected ? '0 4px 12px rgba(0,0,0,0.3)' : 'none'
                                    }}
                                >
                                    {slot.label}
                                </button>
                            );
                        })
                    ) : (
                        <div className="col-span-full flex flex-col items-center justify-center py-8 text-center border-2 border-dashed border-white/10 rounded-xl">
                            <span className="text-2xl mb-2 opacity-50">😴</span>
                            <p style={{ color: 'var(--text-secondary)' }}>
                                No hay horarios disponibles. <br />
                                <span className="text-xs">Intenta seleccionar otro día.</span>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-6 flex items-center justify-center gap-2 opacity-60">
                <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary-color)]"></div>
                <span className="text-[10px] uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>
                    Tiempo del Centro de México
                </span>
            </div>
        </div>
    );
};

export default AppointmentScheduler;
