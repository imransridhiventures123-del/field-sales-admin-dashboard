// FILE: src/pages/FollowUpsPage.jsx — OWNER: Naveen
import { useState } from "react";
import AdminLayout from "../components/AdminLayout";
import { formatDate, FOLLOWUP_LABEL, FOLLOWUP_COLOR } from "../utils/helpers";

const DUMMY = [
  { _id:"f1", shopName:"Big Bazaar",         ownerName:"Ravi",    mobile:"9876540002", employeeName:"Naveen S",     followUpStatus:"payment_due",  followUpDate:new Date(Date.now()+86400000).toISOString().split("T")[0],  status:"Completed" },
  { _id:"f2", shopName:"Sri Murugan Stores", ownerName:"Murugan", mobile:"9876540003", employeeName:"Divya R",      followUpStatus:"callback",     followUpDate:new Date().toISOString().split("T")[0],                     status:"Pending" },
  { _id:"f3", shopName:"Kumar Stores",       ownerName:"Kumar",   mobile:"9876540004", employeeName:"Priya S",      followUpStatus:"interested",   followUpDate:new Date(Date.now()+172800000).toISOString().split("T")[0], status:"Completed" },
  { _id:"f4", shopName:"Daily Fresh Mart",   ownerName:"Rajan",   mobile:"9876540005", employeeName:"Rajan M",      followUpStatus:"callback",     followUpDate:new Date().toISOString().split("T")[0],                     status:"Completed" },
];

export default function FollowUpsPage() {
  const today = new Date().toISOString().split("T")[0];
  const todayItems = DUMMY.filter(f => f.followUpDate === today);
  const upcomingItems = DUMMY.filter(f => f.followUpDate > today);

  return (
    <AdminLayout title="Follow-ups">
      {todayItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
          <p className="text-sm font-semibold text-amber-800 mb-3">🔔 {todayItems.length} Follow-up{todayItems.length>1?"s":""} Due Today</p>
          <div className="space-y-2">
            {todayItems.map(f => (
              <div key={f._id} className="bg-white rounded-xl border border-amber-100 px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-gray-900">{f.shopName}</p>
                  <p className="text-xs text-gray-400">{f.ownerName} · +91 {f.mobile} · {f.employeeName}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${FOLLOWUP_COLOR[f.followUpStatus]}`}>{FOLLOWUP_LABEL[f.followUpStatus]}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-50">
          <h2 className="text-sm font-semibold text-gray-900">Upcoming Follow-ups</h2>
        </div>
        <div className="divide-y divide-gray-50">
          {upcomingItems.map(f => (
            <div key={f._id} className="px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-900">{f.shopName}</p>
                <p className="text-xs text-gray-400 mt-0.5">+91 {f.mobile} · {f.employeeName}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${FOLLOWUP_COLOR[f.followUpStatus]}`}>{FOLLOWUP_LABEL[f.followUpStatus]}</span>
                <span className="text-xs text-gray-400">{formatDate(f.followUpDate)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}