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
        <div style={{ width: '100%' }}>

            {/* Header / Context */}
            {/* Removed header as it is now in the wizard step title */}

            {/* Date Selector (Horizontal Scroll) */}
            <div style={{ marginBottom: '32px' }}>
                <p style={{ fontSize: '14px', fontWeight: 500, color: '#e2e8f0', marginBottom: '16px' }}>Selecciona una fecha</p>

                {/* Scroll Container */}
                <div
                    className="no-scrollbar" // Keeping this custom class if it exists in index.css, otherwise flex will handle basic layout
                    style={{
                        display: 'flex', gap: '12px', overflowX: 'auto',
                        paddingBottom: '8px', scrollBehavior: 'smooth',
                        scrollbarWidth: 'none', msOverflowStyle: 'none'
                    }}
                >
                    {calendarDays.map((date, index) => {
                        const isSelected = isSameDay(date, selectedDate);
                        const isToday = isSameDay(date, new Date());

                        return (
                            <button
                                type="button"
                                key={index}
                                onClick={() => handleDateSelect(date)}
                                style={{
                                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                                    minWidth: '72px', width: '72px', height: '90px',
                                    borderRadius: '16px',
                                    border: isSelected ? '1px solid #f59e0b' : '1px solid #334155',
                                    backgroundColor: isSelected ? '#1e293b' : '#0f172a',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s ease',
                                    boxShadow: isSelected ? '0 0 15px rgba(245, 158, 11, 0.2)' : 'none',
                                    flexShrink: 0  // Prevent squashing
                                }}
                            >
                                {/* "HOY" Badge or Day Name */}
                                <span style={{
                                    fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px',
                                    color: isSelected ? '#f59e0b' : '#94a3b8'
                                }}>
                                    {isToday ? 'HOY' : format(date, 'EEE', { locale: es })}
                                </span>

                                {/* Day Number */}
                                <span style={{
                                    fontSize: '24px', fontWeight: 800, marginBottom: '2px',
                                    color: '#f8fafc'
                                }}>
                                    {format(date, 'd')}
                                </span>

                                {/* Month */}
                                <span style={{
                                    fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px',
                                    color: isSelected ? '#cbd5e1' : '#64748b'
                                }}>
                                    {format(date, 'MMM', { locale: es })}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Time Slots Grid */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <p style={{ fontSize: '14px', fontWeight: 500, color: '#e2e8f0', margin: 0 }}>Horarios Disponibles</p>
                    <span style={{ fontSize: '10px', color: '#64748b' }}>(Tiempo del Centro de México)</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                    {slots.length > 0 ? (
                        slots.map((slot, idx) => {
                            const isSelected = selectedSlot === slot.value;
                            return (
                                <button
                                    type="button"
                                    key={idx}
                                    disabled={!slot.available}
                                    onClick={() => handleSlotClick(slot)}
                                    style={{
                                        padding: '12px 4px',
                                        borderRadius: '12px',
                                        fontSize: '13px', fontWeight: 700,
                                        border: isSelected ? '1px solid #f59e0b' : '1px solid #334155',
                                        backgroundColor: isSelected ? '#f59e0b' : (slot.available ? '#1e293b' : '#0f172a'),
                                        color: isSelected ? '#0f172a' : (slot.available ? '#cbd5e1' : '#475569'),
                                        cursor: slot.available ? 'pointer' : 'not-allowed',
                                        opacity: slot.available ? 1 : 0.4,
                                        transition: 'all 0.2s',
                                        boxShadow: isSelected ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none'
                                    }}
                                >
                                    {slot.label}
                                </button>
                            );
                        })
                    ) : (
                        <div style={{ gridColumn: '1 / -1', padding: '32px', textAlign: 'center', border: '2px dashed #334155', borderRadius: '16px', backgroundColor: '#0f172a' }}>
                            <span style={{ fontSize: '24px', display: 'block', marginBottom: '8px' }}>😴</span>
                            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
                                No hay horarios disponibles. <br />
                                Intenta seleccionar otro día.
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Disclaimer */}
            {/* Disclaimer removed - moved to header */}
        </div>
    );
};

export default AppointmentScheduler;
