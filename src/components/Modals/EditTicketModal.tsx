import React, { useState, useEffect } from 'react';
import { Ticket, SystemOptions } from '../../types';

interface EditTicketModalProps {
  ticket: Ticket | null;
  isOpen: boolean;
  systemOptions: SystemOptions;
  onClose: () => void;
  onSaveTicket: (updated: Ticket) => void;
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

  const handleChange = (field: keyof Ticket, value: string | number) => {
    setFormData((prev) => (prev ? { ...prev, [field]: value } : null));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData) {
      onSaveTicket(formData);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2">
          Update Service Ticket ({formData.id})
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Issue Number (ID)</label>
            <input
              type="text"
              value={formData.id}
              onChange={(e) => handleChange('id', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Current Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {systemOptions.ticketStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Email Subject</label>
            <input
              type="text"
              value={formData.subject}
              onChange={(e) => handleChange('subject', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Email From</label>
            <input
              type="email"
              value={formData.from}
              onChange={(e) => handleChange('from', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Service Request Date</label>
            <input
              type="text"
              value={formData.reqDate}
              onChange={(e) => handleChange('reqDate', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Request Time</label>
            <input
              type="text"
              value={formData.reqTime}
              onChange={(e) => handleChange('reqTime', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Planned Provide Date</label>
            <input
              type="text"
              value={formData.planDate}
              onChange={(e) => handleChange('planDate', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Date to Count</label>
            <input
              type="text"
              value={formData.countDate}
              onChange={(e) => handleChange('countDate', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Service Provide Date</label>
            <input
              type="text"
              value={formData.provDate}
              onChange={(e) => handleChange('provDate', e.target.value)}
              placeholder="e.g. 16/07/26 or Pending"
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Device Location</label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => handleChange('location', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Device ID</label>
            <input
              type="text"
              value={formData.deviceId}
              onChange={(e) => handleChange('deviceId', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Location Type / Category</label>
            <input
              type="text"
              value={formData.locType}
              onChange={(e) => handleChange('locType', e.target.value)}
              placeholder="e.g. Main Branch, Sub Branch, SME, Head Office"
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Issue Type</label>
            <select
              value={formData.issueType}
              onChange={(e) => handleChange('issueType', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {systemOptions.issueTypes.map((it) => (
                <option key={it} value={it}>
                  {it}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Challan Received By</label>
            <input
              type="text"
              value={formData.receivedBy}
              onChange={(e) => handleChange('receivedBy', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Issue Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => handleChange('priority', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {systemOptions.ticketPriorities.map((tp) => (
                <option key={tp} value={tp}>
                  {tp}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Current Status</label>
            <select
              value={formData.status}
              onChange={(e) => handleChange('status', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {systemOptions.ticketStatuses.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Technician Details</label>
            <input
              type="text"
              value={formData.tech}
              onChange={(e) => handleChange('tech', e.target.value)}
              placeholder="e.g. Rahim Ahmed / Engineer Name & Phone"
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Resolution Time (Days)</label>
            <input
              type="number"
              value={formData.resTime}
              onChange={(e) => handleChange('resTime', Number(e.target.value))}
              min={0}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">SLA Threshold (Days)</label>
            <input
              type="number"
              value={formData.slaThreshold}
              onChange={(e) => handleChange('slaThreshold', Number(e.target.value))}
              min={1}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">SLA Status</label>
            <input
              type="text"
              value={formData.slaStatus}
              onChange={(e) => handleChange('slaStatus', e.target.value)}
              placeholder="e.g. WITHIN SLA or SLA BREACH"
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-slate-400 mb-1">
              Remarks / Action Taken
            </label>
            <textarea
              rows={2}
              value={formData.remarks}
              onChange={(e) => handleChange('remarks', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            ></textarea>
          </div>
          <div className="col-span-2">
            <label className="block text-slate-400 mb-1">
              Visit Email Details
            </label>
            <textarea
              rows={2}
              value={formData.emailDetails}
              onChange={(e) => handleChange('emailDetails', e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            ></textarea>
          </div>
          <div className="col-span-2 flex justify-end space-x-2 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded font-bold cursor-pointer hover:bg-slate-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded font-bold cursor-pointer"
            >
              Save Updates
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
