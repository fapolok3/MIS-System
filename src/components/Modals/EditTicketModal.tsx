import React, { useState, useEffect } from 'react';
import { Ticket, SystemOptions } from '../../types';

interface EditTicketModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  systemOptions: SystemOptions;
  onClose: () => void;
  onSaveTicket: (updated: Ticket, originalId?: string) => void;
}

export const EditTicketModal: React.FC<EditTicketModalProps> = ({
  ticket,
  isOpen,
  systemOptions,
  onClose,
  onSaveTicket,
}) => {
  const [formData, setFormData] = useState<Ticket | null>(ticket);

  useEffect(() => {
    setFormData(ticket);
  }, [ticket]);

  if (!isOpen || !formData) return null;

  const toInputDate = (d?: string) => {
    if (!d || d === 'Pending' || d === '-') return '';
    if (d.includes('-')) return d;
    const parts = d.split('/');
    if (parts.length === 3) {
      const day = parts[0].padStart(2, '0');
      const month = parts[1].padStart(2, '0');
      let year = parts[2];
      if (year.length === 2) year = `20${year}`;
      return `${year}-${month}-${day}`;
    }
    return '';
  };

  const toStorageDate = (d: string) => {
    if (!d) return 'Pending';
    const parts = d.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
    }
    return d;
  };

  const handleChange = (field: keyof Ticket, value: string | number) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSaveTicket(formData, ticket?.id);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2">
          Update Service Ticket ({formData.id})
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Issue Number (ID)</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Current Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {systemOptions.ticketStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Email Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Email From</label>
            <input
              type="email"
              value={formData.from}
              onChange={(e) => handleChange('from', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Service Request Date</label>
            <input
              type="text"
              value={formData.reqDate}
              onChange={(e) => handleChange('reqDate', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Request Time</label>
            <input
              type="text"
              value={formData.reqTime}
              onChange={(e) => handleChange('reqTime', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Planned Provide Date</label>
            <input
              type="text"
              value={formData.planDate}
              onChange={(e) => handleChange('planDate', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Date to Count</label>
            <input
              type="text"
              value={formData.countDate}
              onChange={(e) => handleChange('countDate', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 dark:text-slate-400 font-semibold">Service Provide Date</label>
              {formData.provDate && formData.provDate !== 'Pending' ? (
                <button
                  type="button"
                  onClick={() => handleChange('provDate', 'Pending')}
                  className="text-[10.5px] text-rose-600 dark:text-rose-400 hover:underline font-medium cursor-pointer"
                >
                  Set Pending
                </button>
              ) : (
                <span className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium">
                  (Pending)
                </span>
              )}
            </div>
            <input
              type="date"
              value={toInputDate(formData.provDate)}
              onChange={(e) => handleChange('provDate', toStorageDate(e.target.value))}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Device Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Device ID</label>
            <input
              type="text"
              value={formData.deviceId}
              onChange={(e) => handleChange('deviceId', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Location Type / Category</label>
            <input
              type="text"
              value={formData.locType}
              onChange={(e) => handleChange('locType', e.target.value)}
              placeholder="e.g. Main Branch, Sub Branch, SME, Head Office"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Issue Type</label>
            <select
              value={formData.issueType}
              onChange={(e) => handleChange('issueType', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {systemOptions.issueTypes.map((it) => (
                <option key={it} value={it}>
                  {it}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Challan Received By</label>
            <input
              type="text"
              value={formData.receivedBy}
              onChange={(e) => handleChange('receivedBy', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Issue Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {systemOptions.ticketPriorities.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Current Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            >
              {systemOptions.ticketStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Technician Details</label>
            <input
              type="text"
              value={formData.tech}
              onChange={(e) => handleChange('tech', e.target.value)}
              placeholder="e.g. Rahim Ahmed / Engineer Name & Phone"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Resolution Time (Days)</label>
            <input
              type="number"
              value={formData.resTime}
              onChange={(e) => handleChange('resTime', Number(e.target.value))}
              min={0}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">SLA Threshold (Days)</label>
            <input
              type="number"
              value={formData.slaThreshold}
              onChange={(e) => handleChange('slaThreshold', Number(e.target.value))}
              min={1}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">SLA Status</label>
            <input
              type="text"
              value={formData.slaStatus}
              onChange={(e) => handleChange('slaStatus', e.target.value)}
              placeholder="e.g. WITHIN SLA or SLA BREACH"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">
              Remarks / Action Taken
            </label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            ></textarea>
          </div>
          <div className="col-span-2">
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">
              Visit Email Details
            </label>
            <textarea
              rows={2}
              value={formData.emailDetails}
              onChange={(e) => handleChange('emailDetails', e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            ></textarea>
          </div>
          <div className="col-span-2 flex justify-end space-x-2 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-transparent"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg font-bold cursor-pointer shadow-xs"
            >
              Save Updates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
