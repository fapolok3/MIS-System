import React, { useState } from 'react';
import { Ticket, SystemOptions } from '../../types';

interface NewTicketModalProps {
  isOpen: boolean;
  systemOptions: SystemOptions;
  onClose: () => void;
  onSaveTicket: (ticket: Ticket) => void;
  ticketCount: number;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  systemOptions,
  onClose,
  onSaveTicket,
  ticketCount,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [subject, setSubject] = useState('');
  const [from, setFrom] = useState('');
  const [reqDate, setReqDate] = useState(todayStr);
  const [reqTime, setReqTime] = useState('10:00');
  const [location, setLocation] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [locType, setLocType] = useState(systemOptions.locationTypes[0] || 'Main Branch');
  const [issueType, setIssueType] = useState(systemOptions.issueTypes[0] || 'Network Disconnection');
  const [priority, setPriority] = useState<any>(systemOptions.ticketPriorities[0] || 'HIGH');
  const [tech, setTech] = useState(systemOptions.technicians[0] || 'Rahim Ahmed');
  const [remarks, setRemarks] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const seq = String(ticketCount + 1).padStart(3, '0');
    const ticketId = `INV-BBL-${year}${month}${day}${seq}`;

    const dateParts = reqDate.split('-');
    const formattedDate =
      dateParts.length === 3
        ? `${dateParts[2]}/${dateParts[1]}/${dateParts[0].slice(2)}`
        : `${day}/${month}/${year.toString().slice(-2)}`;

    const newTicket: Ticket = {
      id: ticketId,
      subject,
      from,
      reqDate: formattedDate,
      reqTime: reqTime || '10:00',
      planDate: formattedDate,
      countDate: formattedDate,
      provDate: 'Pending',
      location,
      deviceId,
      locType,
      issueType,
      receivedBy: 'System Logged',
      priority,
      status: 'OPEN',
      resTime: 0,
      slaThreshold: 2,
      slaStatus: 'WITHIN SLA',
      tech: tech || 'Unassigned',
      remarks: remarks || '-',
      emailDetails: 'Ticket created successfully.',
    };

    onSaveTicket(newTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border border-slate-700 rounded-lg max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-sm font-bold text-white uppercase border-b border-slate-800 pb-2">
          Generate New Service Ticket
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-400 mb-1">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Network Disconnection Issue"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Email From</label>
            <input
              type="email"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="e.g. support@gouripur.bracbank.com"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">
              Service Request Date
            </label>
            <input
              type="date"
              value={reqDate}
              onChange={(e) => setReqDate(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Request Time (HH:MM)</label>
            <input
              type="time"
              value={reqTime}
              onChange={(e) => setReqTime(e.target.value)}
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Device Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Gouripur Branch"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Device ID</label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g. 300101"
              required
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-slate-400 mb-1">
              Location Type / Category
            </label>
            <select
              value={locType}
              onChange={(e) => setLocType(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {systemOptions.locationTypes.map((lt) => (
                <option key={lt} value={lt}>
                  {lt}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-slate-400 mb-1">Issue Type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
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
            <label className="block text-slate-400 mb-1">Issue Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
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
            <label className="block text-slate-400 mb-1">Technician Details</label>
            <select
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white focus:outline-none"
            >
              {systemOptions.technicians.map((tc) => (
                <option key={tc} value={tc}>
                  {tc}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-slate-400 mb-1">
              Remarks / Action Taken
            </label>
            <textarea
              rows={2}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. রবি সিমের নেটওয়ার্ক ড্রপ করছে। গ্রামীন সিম কার্ড রিপ্লেস করতে হবে।"
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
              Generate Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
