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

  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const seq = String(ticketCount + 1).padStart(3, '0');
  const defaultTicketId = `INV-BBL-${year}${month}${day}${seq}`;

  const [ticketIdInput, setTicketIdInput] = useState(defaultTicketId);
  const [subject, setSubject] = useState('');
  const [from, setFrom] = useState('');
  const [reqDate, setReqDate] = useState(todayStr);
  const [reqTime, setReqTime] = useState('10:00');
  const [planDate, setPlanDate] = useState(todayStr);
  const [countDate, setCountDate] = useState(todayStr);
  const [provDate, setProvDate] = useState('');
  const [location, setLocation] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [locType, setLocType] = useState('Main Branch');
  const [issueType, setIssueType] = useState(systemOptions.issueTypes[0] || 'Network Disconnection');
  const [receivedBy, setReceivedBy] = useState('System Logged');
  const [priority, setPriority] = useState<any>(systemOptions.ticketPriorities[0] || 'HIGH');
  const [status, setStatus] = useState<any>(systemOptions.ticketStatuses[0] || 'OPEN');
  const [resTime, setResTime] = useState(0);
  const [slaThreshold, setSlaThreshold] = useState(2);
  const [slaStatus, setSlaStatus] = useState('WITHIN SLA');
  const [tech, setTech] = useState('');
  const [remarks, setRemarks] = useState('');
  const [emailDetails, setEmailDetails] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const formatDate = (dateStr: string) => {
      if (!dateStr || dateStr === 'Pending') return dateStr || 'Pending';
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0].slice(2)}`;
      }
      return dateStr;
    };

    const formattedReqDate = formatDate(reqDate);
    const formattedPlanDate = planDate ? formatDate(planDate) : formattedReqDate;
    const formattedCountDate = countDate ? formatDate(countDate) : formattedReqDate;
    const formattedProvDate = provDate ? formatDate(provDate) : 'Pending';

    const newTicket: Ticket = {
      id: ticketIdInput || defaultTicketId,
      subject,
      from,
      reqDate: formattedReqDate,
      reqTime: reqTime || '10:00',
      planDate: formattedPlanDate,
      countDate: formattedCountDate,
      provDate: formattedProvDate,
      location,
      deviceId,
      locType,
      issueType,
      receivedBy: receivedBy || 'System Logged',
      priority,
      status,
      resTime: Number(resTime) || 0,
      slaThreshold: Number(slaThreshold) || 2,
      slaStatus: slaStatus || 'WITHIN SLA',
      tech: tech || 'Unassigned',
      remarks: remarks || '-',
      emailDetails: emailDetails || 'Ticket created successfully.',
    };

    onSaveTicket(newTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 dark:bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl max-w-2xl w-full p-5 space-y-4 max-h-[90vh] overflow-y-auto shadow-2xl">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase border-b border-slate-200 dark:border-slate-800 pb-2">
          Generate New Service Ticket
        </h3>
        <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Issue Number (Ticket ID)</label>
            <input
              type="text"
              value={ticketIdInput}
              onChange={(e) => setTicketIdInput(e.target.value)}
              placeholder="e.g. INV-BBL-20260210001"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Email Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Network Disconnection Issue"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Email From</label>
            <input
              type="email"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder="e.g. support@gouripur.bracbank.com"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">
              Service Request Date
            </label>
            <input
              type="date"
              value={reqDate}
              onChange={(e) => setReqDate(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Request Time (HH:MM)</label>
            <input
              type="time"
              value={reqTime}
              onChange={(e) => setReqTime(e.target.value)}
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Planned Provide Date</label>
            <input
              type="date"
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Date to Count</label>
            <input
              type="date"
              value={countDate}
              onChange={(e) => setCountDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-slate-700 dark:text-slate-400 font-semibold">Service Provide Date</label>
              {provDate ? (
                <button
                  type="button"
                  onClick={() => setProvDate('')}
                  className="text-[10.5px] text-rose-600 dark:text-rose-400 hover:underline font-medium cursor-pointer"
                >
                  Set Pending
                </button>
              ) : (
                <span className="text-[10.5px] text-amber-600 dark:text-amber-400 font-medium">
                  (Default: Pending)
                </span>
              )}
            </div>
            <input
              type="date"
              value={provDate}
              onChange={(e) => setProvDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Device Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Gouripur Branch"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Device ID</label>
            <input
              type="text"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="e.g. 300101"
              required
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">
              Location Type / Category
            </label>
            <input
              type="text"
              value={locType}
              onChange={(e) => setLocType(e.target.value)}
              placeholder="e.g. Main Branch, Sub Branch, SME, Head Office"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Issue Type</label>
            <select
              value={issueType}
              onChange={(e) => setIssueType(e.target.value)}
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
              value={receivedBy}
              onChange={(e) => setReceivedBy(e.target.value)}
              placeholder="e.g. System Logged / Name"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Issue Priority</label>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
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
              value={status}
              onChange={(e) => setStatus(e.target.value)}
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
              value={tech}
              onChange={(e) => setTech(e.target.value)}
              placeholder="e.g. Rahim Ahmed / Engineer Name & Phone"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">Resolution Time (Days)</label>
            <input
              type="number"
              value={resTime}
              onChange={(e) => setResTime(Number(e.target.value))}
              min={0}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">SLA Threshold (Days)</label>
            <input
              type="number"
              value={slaThreshold}
              onChange={(e) => setSlaThreshold(Number(e.target.value))}
              min={1}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">SLA Status</label>
            <input
              type="text"
              value={slaStatus}
              onChange={(e) => setSlaStatus(e.target.value)}
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
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="e.g. রবি সিমের নেটওয়ার্ক ড্রপ করছে। গ্রামীন সিম কার্ড রিপ্লেস করতে হবে।"
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500"
            ></textarea>
          </div>
          <div className="col-span-2">
            <label className="block text-slate-700 dark:text-slate-400 mb-1 font-semibold">
              Visit Email Details
            </label>
            <textarea
              rows={2}
              value={emailDetails}
              onChange={(e) => setEmailDetails(e.target.value)}
              placeholder="e.g. On-site visit performed by technician."
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
              Generate Ticket
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
