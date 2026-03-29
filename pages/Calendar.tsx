import React, { useState } from 'react';
import { PageHeader, Card, Badge, Button, Skeleton, useToast } from '../UI';
import { Calendar as CalendarIcon, Clock, User, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { useAppointments, useCreateAppointment } from '../api';

const Calendar: React.FC = () => {
    const { addToast } = useToast();
    const createAppointment = useCreateAppointment();
    const [currentDate, setCurrentDate] = useState(new Date());
    const [isNewAppointmentOpen, setIsNewAppointmentOpen] = useState(false);
    const { data: appointments = [], isLoading } = useAppointments();

    // Appointment form state
    const [apptForm, setApptForm] = useState({
        type: 'Test Drive' as 'Test Drive' | 'Service' | 'Delivery' | 'Meeting',
        date: '',
        time: '',
        customerName: '',
        resource: '',
        notes: ''
    });

    if (isLoading) return <div className="space-y-6 animate-fade-in"><Skeleton className="h-12 w-1/4" /><div className="grid grid-cols-1 lg:grid-cols-4 gap-6"><Skeleton className="h-64" /><Skeleton className="h-96 lg:col-span-3" /></div></div>;

    // Get month name
    const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

    // Get current day of week and date
    const dayName = currentDate.toLocaleDateString('default', { weekday: 'long' });
    const monthDay = currentDate.toLocaleDateString('default', { month: 'short', day: 'numeric' });

    // Navigate months
    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
    };

    // Navigate days
    const previousDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 1);
        setCurrentDate(newDate);
    };

    const nextDay = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 1);
        setCurrentDate(newDate);
    };

    // Generate calendar days
    const getDaysInMonth = () => {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        const lastDay = new Date(year, month + 1, 0);
        const daysInMonth = lastDay.getDate();

        return Array.from({ length: daysInMonth }, (_, i) => i + 1);
    };

    const handleDayClick = (day: number) => {
        const newDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), day);
        setCurrentDate(newDate);
    };

    const resetForm = () => {
        setApptForm({
            type: 'Test Drive',
            date: '',
            time: '',
            customerName: '',
            resource: '',
            notes: ''
        });
    };

    const handleCreateAppointment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!apptForm.customerName || !apptForm.date || !apptForm.time) {
            addToast('Please fill in all required fields', 'error');
            return;
        }

        const startDateTime = `${apptForm.date}T${apptForm.time}:00`;
        const endDate = new Date(startDateTime);
        endDate.setHours(endDate.getHours() + 1); // Default 1 hour duration

        try {
            await createAppointment.mutateAsync({
                title: `${apptForm.type} - ${apptForm.resource || apptForm.customerName}`,
                start: startDateTime,
                end: endDate.toISOString(),
                type: apptForm.type,
                customerName: apptForm.customerName,
                resourceId: apptForm.resource || undefined,
                notes: apptForm.notes || undefined,
                status: 'Confirmed'
            });
            addToast('Appointment scheduled successfully!', 'success');
            setIsNewAppointmentOpen(false);
            resetForm();
        } catch (err) {
            addToast('Failed to create appointment. Please try again.', 'error');
        }
    };

    // Filter appointments for the selected day
    const selectedDateStr = currentDate.toISOString().split('T')[0];
    const todayAppointments = appointments.filter(a => a.start && a.start.startsWith(selectedDateStr));

    return (
        <div className="space-y-8 animate-fade-in">
            <PageHeader
                title="Schedule"
                subtitle="Manage test drives, service appointments, and vehicle deliveries."
                actions={
                    <Button
                        icon={Plus}
                        onClick={() => {
                            setApptForm(prev => ({ ...prev, date: currentDate.toISOString().split('T')[0] }));
                            setIsNewAppointmentOpen(true);
                        }}
                    >
                        New Appointment
                    </Button>
                }
            />

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Mini Calendar / Filter Sidebar */}
                <div className="space-y-6">
                    <Card className="p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-slate-900">{monthName}</h3>
                            <div className="flex gap-1">
                                <button
                                    onClick={previousMonth}
                                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                                >
                                    <ChevronLeft size={16} />
                                </button>
                                <button
                                    onClick={nextMonth}
                                    className="p-1 hover:bg-slate-100 rounded transition-colors"
                                >
                                    <ChevronRight size={16} />
                                </button>
                            </div>
                        </div>
                        {/* Calendar Grid */}
                        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2 text-slate-400 font-bold">
                            <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                        </div>
                        <div className="grid grid-cols-7 gap-1 text-center text-sm">
                            {getDaysInMonth().map((day) => {
                                const dayDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                                const hasAppointments = appointments.some(a => a.start && a.start.startsWith(dayDateStr));
                                return (
                                    <button
                                        key={day}
                                        onClick={() => handleDayClick(day)}
                                        className={`p-2 rounded-lg cursor-pointer hover:bg-slate-50 transition-colors relative ${day === currentDate.getDate()
                                            ? 'bg-blue-600 text-white font-bold hover:bg-blue-700'
                                            : 'text-slate-600'
                                            }`}
                                    >
                                        {day}
                                        {hasAppointments && day !== currentDate.getDate() && (
                                            <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500"></span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </Card>

                    <Card>
                        <h3 className="font-bold text-slate-900 mb-4">Filter Resources</h3>
                        <div className="space-y-3">
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" defaultChecked />
                                Test Drive Vehicles
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" defaultChecked />
                                Service Bays
                            </label>
                            <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer">
                                <input type="checkbox" className="rounded text-blue-600 focus:ring-blue-500" defaultChecked />
                                Sales Consultants
                            </label>
                        </div>
                    </Card>
                </div>

                {/* Day View */}
                <Card className="lg:col-span-3">
                    <div className="flex items-center justify-between mb-6 pb-6 border-b border-slate-100">
                        <div className="flex items-center gap-4">
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <CalendarIcon size={20} className="text-slate-400" />
                                {dayName}, {monthDay}
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={previousDay}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Previous Day"
                                >
                                    <ChevronLeft size={18} />
                                </button>
                                <button
                                    onClick={nextDay}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    title="Next Day"
                                >
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Badge variant="neutral" size="sm">{todayAppointments.length} appointment{todayAppointments.length !== 1 ? 's' : ''}</Badge>
                            <div className="flex gap-2">
                                <Button variant="secondary" size="sm">Day</Button>
                                <Button variant="secondary" size="sm" className="bg-transparent border-transparent text-slate-400 hover:bg-slate-50">Week</Button>
                                <Button variant="secondary" size="sm" className="bg-transparent border-transparent text-slate-400 hover:bg-slate-50">Month</Button>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2 relative">
                        {/* Time slots */}
                        {['09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'].map(time => (
                            <div key={time} className="flex gap-4 group h-24">
                                <div className="w-16 text-xs font-bold text-slate-400 pt-2 text-right">{time}</div>
                                <div className="flex-1 border-t border-slate-100 relative group-hover:bg-slate-50/50 transition-colors">
                                    {/* Render Appointments matching this time approximately */}
                                    {appointments.filter(a => a.start.includes(`${time}`)).map(apt => (
                                        <div key={apt.id} className={`absolute top-2 left-2 right-4 p-3 rounded-xl border opacity-90 hover:opacity-100 hover:shadow-md transition-all cursor-pointer ${apt.type === 'Test Drive' ? 'bg-blue-50 border-blue-100 text-blue-700' :
                                            apt.type === 'Service' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                                'bg-green-50 border-green-100 text-green-700'
                                            }`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="font-bold text-sm">{apt.title}</div>
                                                    <div className="text-xs opacity-80 mt-1 flex items-center gap-2">
                                                        <User size={12} /> {apt.customerName}
                                                    </div>
                                                </div>
                                                <Badge size="sm" variant="neutral">{apt.status}</Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Empty day message */}
                        {todayAppointments.length === 0 && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <div className="text-center bg-white/80 backdrop-blur-sm rounded-2xl p-8">
                                    <CalendarIcon size={32} className="text-slate-300 mx-auto mb-3" />
                                    <p className="font-semibold text-slate-500">No appointments scheduled</p>
                                    <p className="text-xs text-slate-400 mt-1">Click "New Appointment" to add one</p>
                                </div>
                            </div>
                        )}
                    </div>
                </Card>
            </div>

            {/* New Appointment Modal */}
            {isNewAppointmentOpen && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 flex items-center justify-between">
                            <div>
                                <h2 className="text-2xl font-black">Schedule New Appointment</h2>
                                <p className="text-blue-100 text-sm mt-1">Book test drives, service appointments, or deliveries</p>
                            </div>
                            <button
                                onClick={() => { setIsNewAppointmentOpen(false); resetForm(); }}
                                className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                            >
                                <Plus size={24} className="rotate-45" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateAppointment} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Appointment Type *</label>
                                <select
                                    value={apptForm.type}
                                    onChange={(e) => setApptForm({ ...apptForm, type: e.target.value as any })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                >
                                    <option value="Test Drive">Test Drive</option>
                                    <option value="Service">Service Appointment</option>
                                    <option value="Delivery">Vehicle Delivery</option>
                                    <option value="Meeting">Customer Meeting</option>
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Date *</label>
                                    <input
                                        type="date"
                                        required
                                        value={apptForm.date}
                                        onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-600 mb-2">Time *</label>
                                    <input
                                        type="time"
                                        required
                                        value={apptForm.time}
                                        onChange={(e) => setApptForm({ ...apptForm, time: e.target.value })}
                                        className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Customer Name *</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Enter customer name"
                                    value={apptForm.customerName}
                                    onChange={(e) => setApptForm({ ...apptForm, customerName: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Resource (Vehicle/Bay)</label>
                                <input
                                    type="text"
                                    placeholder="e.g., S07 Eclipse Black or Bay-1"
                                    value={apptForm.resource}
                                    onChange={(e) => setApptForm({ ...apptForm, resource: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-2">Notes</label>
                                <textarea
                                    rows={3}
                                    placeholder="Any additional details..."
                                    value={apptForm.notes}
                                    onChange={(e) => setApptForm({ ...apptForm, notes: e.target.value })}
                                    className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none"
                                />
                            </div>

                            <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
                                <Button
                                    type="button"
                                    variant="secondary"
                                    onClick={() => { setIsNewAppointmentOpen(false); resetForm(); }}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    className="flex-1"
                                    disabled={createAppointment.isPending}
                                >
                                    {createAppointment.isPending ? 'Creating...' : 'Create Appointment'}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Calendar;
