import React from 'react';
import { Headphones, Plus, Edit, Trash2 } from 'lucide-react';
import { Ticket } from '../types';

interface ServiceTabProps {
  tickets: Ticket[];
  onOpenNewTicketModal: () => void;
  onOpenEditTicketModal: (ticket: Ticket) => void;
  onDeleteTicket: (ticketId: string) => void;
}

export const ServiceTab: React.FC<ServiceTabProps> = ({
  tickets,
  onOpenNewTicketModal,
  onOpenEditTicketModal,
  onDeleteTicket,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-slate-800/80 border border-slate-700/60 p-4 rounded-lg flex justify-between items-center">
        <div>
          <h2 className="text-sm font-bold text-white uppercase flex items-center">
            <Headphones className="w-4 h-4 text-indigo-400 mr-2" />
            Service Ticket & SLA Tracker
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Auto Generated Format: INV-BBL-YYYYMMDD001
          </p>
        </div>
        <button
          onClick={onOpenNewTicketModal}
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs px-3 py-1.5 rounded shadow flex items-center gap-1 cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" /> New Ticket
        </button>
      </div>

      <div className="bg-slate-800/50 border border-slate-800 rounded-lg p-4 space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse whitespace-nowrap">
            <thead className="bg-slate-950 text-slate-300 uppercase font-bold border-b border-slate-800 text-[10px]">
              <tr>
                <th className="p-2.5 border-r border-slate-800 sticky left-0 bg-slate-950 z-10 text-center">
                  Action
                </th>
                <th className="p-2.5 border-r border-slate-800">Issue Number</th>
                <th className="p-2.5 border-r border-slate-800">Email Subject</th>
                <th className="p-2.5 border-r border-slate-800">Email From</th>
                <th className="p-2.5 border-r border-slate-800">
                  Service Request Date
                </th>
                <th className="p-2.5 border-r border-slate-800">Request Time</th>
                <th className="p-2.5 border-r border-slate-800">
                  Planned Provide Date
                </th>
                <th className="p-2.5 border-r border-slate-800">Date to count</th>
                <th className="p-2.5 border-r border-slate-800">
                  Service Provide Date
                </th>
                <th className="p-2.5 border-r border-slate-800">Device Location</th>
                <th className="p-2.5 border-r border-slate-800">Device ID</th>
                <th className="p-2.5 border-r border-slate-800">Location Type</th>
                <th className="p-2.5 border-r border-slate-800">Issue Type</th>
                <th className="p-2.5 border-r border-slate-800">
                  Challan Received By
                </th>
                <th className="p-2.5 border-r border-slate-800">Issue Priority</th>
                <th className="p-2.5 border-r border-slate-800">Current Status</th>
                <th className="p-2.5 border-r border-slate-800">
                  Resolution Time (Days)
                </th>
                <th className="p-2.5 border-r border-slate-800">
                  SLA Threshold (Days)
                </th>
                <th className="p-2.5 border-r border-slate-800">SLA Status</th>
                <th className="p-2.5 border-r border-slate-800">
                  Technician details
                </th>
                <th className="p-2.5 border-r border-slate-800">Remarks</th>
                <th className="p-2.5 border-r border-slate-800">
                  Visit Email Details
                </th>
                <th className="p-2.5 text-center">Delete</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
              {tickets.length === 0 ? (
                <tr>
                  <td
                    colSpan={23}
                    className="text-center p-4 text-slate-500 font-sans"
                  >
                    No service tickets found
                  </td>
                </tr>
              ) : (
                tickets.map((t) => {
                  const priorityBadge =
                    t.priority === 'CRITICAL' ? (
                      <span className="bg-rose-900/80 text-rose-200 border border-rose-600 px-2 py-0.5 rounded text-[10px] font-bold">
                        CRITICAL
                      </span>
                    ) : (
                      <span className="bg-amber-900/60 text-amber-300 border border-amber-700/50 px-2 py-0.5 rounded text-[10px] font-bold">
                        {t.priority}
                      </span>
                    );

                  return (
                    <tr key={t.id} className="hover:bg-slate-800/40">
                      <td className="p-2.5 border-r border-slate-800 sticky left-0 bg-slate-900 z-10 text-center">
                        <button
                          onClick={() => onOpenEditTicketModal(t)}
                          className="text-indigo-400 font-bold hover:underline font-sans flex items-center justify-center gap-1 cursor-pointer mx-auto"
                        >
                          <Edit className="w-3 h-3" /> Edit
                        </button>
                      </td>
                      <td className="p-2.5 border-r border-slate-800 text-indigo-400 font-bold">
                        {t.id}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.subject}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.from}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.reqDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.reqTime}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.planDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.countDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.provDate}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.location}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.deviceId}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.locType}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.issueType}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.receivedBy}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {priorityBadge}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        <span className="bg-amber-900/40 text-amber-300 px-2 py-0.5 rounded text-[10px]">
                          {t.status}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.resTime}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        {t.slaThreshold}
                      </td>
                      <td className="p-2.5 border-r border-slate-800">
                        <span className="text-emerald-400 font-bold">
                          {t.slaStatus}
                        </span>
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans">
                        {t.tech}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans max-w-xs truncate">
                        {t.remarks}
                      </td>
                      <td className="p-2.5 border-r border-slate-800 font-sans max-w-xs truncate">
                        {t.emailDetails}
                      </td>
                      <td className="p-2.5 text-center">
                        <button
                          onClick={() => onDeleteTicket(t.id)}
                          className="bg-rose-900/50 hover:bg-rose-800 text-rose-200 text-[10px] font-bold px-2 py-0.5 rounded font-sans cursor-pointer flex items-center gap-1 mx-auto"
                        >
                          <Trash2 className="w-3 h-3" /> DELETE
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
