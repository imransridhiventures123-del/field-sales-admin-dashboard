// FILE: src/pages/VisitDetailPage.jsx
// OWNER: Naveen
// PURPOSE: Full detail of a single visit in the admin dashboard
// CHANGE: Removed DUMMY_VISITS. Loads the real visit from
// GET /api/admin/visits/:id via getVisitById(id).
// Route registered in App.jsx is "/visits/:id".

import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { formatDateTime, formatDate, STATUS_COLOR, FOLLOWUP_LABEL, FOLLOWUP_COLOR } from "../utils/helpers";
import { getVisitById } from "../api/visitsApi";

// Section wrapper
function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">{title}</p>
      </div>
      <div className="px-5 py-4">{children}</div>
    </div>
  );
}

// Row inside a section
function InfoRow({ label, value, mono = false, color }) {
  return (
    <div className="flex items-start gap-4 py-2.5 border-b border-gray-50 last:border-0">
      <p className="text-xs text-gray-400 w-36 flex-shrink-0 pt-0.5">{label}</p>
      <p className={`text-sm font-medium flex-1 ${color || "text-gray-800"} ${mono ? "font-mono" : ""}`}>
        {value || "—"}
      </p>
    </div>
  );
}

export default function VisitDetailPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const [visit, setVisit]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchVisit = async () => {
      setLoading(true);
      setNotFound(false);
      try {
        const data = await getVisitById(id);
        if (!active) return;
        setVisit(data.visit || null);
        if (!data.visit) setNotFound(true);
      } catch (err) {
        if (!active) return;
        console.error("Visit detail fetch error:", err.message);
        setNotFound(true);
      } finally {
        if (active) setLoading(false);
      }
    };
    fetchVisit();
    return () => { active = false; };
  }, [id]);

  if (loading) {
    return (
      <AdminLayout title="Visit Detail">
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <p className="text-gray-400 text-sm">Loading visit...</p>
        </div>
      </AdminLayout>
    );
  }

  if (notFound || !visit) {
    return (
      <AdminLayout title="Visit Detail">
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Visit not found.</p>
          <button onClick={() => navigate("/all-visits")} className="mt-4 text-blue-600 text-sm font-medium">← Back to All Visits</button>
        </div>
      </AdminLayout>
    );
  }

  const followUpStatus = visit.followUp?.status;
  const followUpDate   = visit.followUp?.date;
  const photos = visit.photos || [];
  const googleMapsUrl = `https://www.google.com/maps?q=${visit.latitude},${visit.longitude}`;

  return (
    <AdminLayout title="Visit Detail">

      {/* Back */}
      <button onClick={() => navigate("/all-visits")}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-5 transition">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7"/>
        </svg>
        Back to All Visits
      </button>

      {/* ── STATUS HEADER ── */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{visit.shopName}</h2>
            {visit.shopCode && <p className="text-sm text-gray-400 mt-0.5 font-mono">{visit.shopCode}</p>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Visit status */}
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLOR[visit.status]}`}>
              {visit.status}
            </span>
            {/* Follow-up status */}
            {followUpStatus && (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${FOLLOWUP_COLOR[followUpStatus]}`}>
                {FOLLOWUP_LABEL[followUpStatus]}
              </span>
            )}
            {/* Field type */}
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${visit.fieldType === "Field Sales" ? "bg-blue-50 text-blue-700" : "bg-purple-50 text-purple-700"}`}>
              {visit.fieldType}
            </span>
          </div>
        </div>

        {/* Time info */}
        <div className="flex flex-wrap gap-5 mt-4 pt-4 border-t border-gray-50 text-xs text-gray-400">
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Visit recorded: {formatDateTime(visit.createdAt)}
          </span>
          {visit.updatedAt && visit.updatedAt !== visit.createdAt && (
            <span className="flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              Last updated: {formatDateTime(visit.updatedAt)}
            </span>
          )}
          {followUpDate && (
            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Follow-up due: {formatDate(followUpDate)}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* ── LEFT COLUMN ── */}
        <div className="space-y-5">

          {/* Shop Info */}
          <Section title="Shop Information">
            <InfoRow label="Shop Name"   value={visit.shopName}  />
            <InfoRow label="Shop Code"   value={visit.shopCode}  mono />
            <InfoRow label="Owner Name"  value={visit.ownerName} />
            <InfoRow label="Contact No." value={visit.mobile ? `+91 ${visit.mobile}` : null} color="text-blue-600" />
            <InfoRow label="Field Type"  value={visit.fieldType} />
            <InfoRow label="Address"     value={visit.address}   />
            {visit.notes && <InfoRow label="Notes" value={visit.notes} />}
          </Section>

          {/* Employee Info */}
          <Section title="Field Employee">
            {visit.employee ? (
              <div
                onClick={() => navigate(`/sales-team/${visit.employee._id}`)}
                className="flex items-center gap-4 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition -mx-1"
              >
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                  {visit.employee.name?.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-gray-900">{visit.employee.name}</p>
                  <p className="text-xs text-gray-400 font-mono">{visit.employee.employeeId}</p>
                  <p className="text-xs text-blue-600 mt-0.5">+91 {visit.employee.mobile}</p>
                </div>
                <svg className="w-4 h-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            ) : (
              <p className="text-sm text-gray-400">No employee on this visit.</p>
            )}
          </Section>

          {/* Telecaller assigned */}
          <Section title="Assigned Telecaller">
            {visit.telecaller?.name ? (
              <div className="flex items-center gap-4 p-3 rounded-xl bg-green-50 -mx-1">
                <div className="w-11 h-11 bg-green-100 rounded-xl flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                  {visit.telecaller.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{visit.telecaller.name}</p>
                  <p className="text-xs text-green-700 font-medium">+91 {visit.telecaller.phone}</p>
                  <p className="text-[11px] text-green-500 mt-0.5">Will follow up with this shop</p>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 -mx-1">
                <div className="w-11 h-11 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                </div>
                <p className="text-sm text-gray-400">No telecaller assigned yet</p>
              </div>
            )}
          </Section>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="space-y-5">

          {/* GPS Location */}
          <Section title="GPS Location">
            {visit.latitude && visit.longitude ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Latitude</p>
                    <p className="text-sm font-mono font-semibold text-gray-800">{visit.latitude.toFixed(6)}</p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-1">Longitude</p>
                    <p className="text-sm font-mono font-semibold text-gray-800">{visit.longitude.toFixed(6)}</p>
                  </div>
                </div>
                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition active:scale-[0.98]"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  View on Google Maps
                </a>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Location not captured</p>
            )}
          </Section>

          {/* Photos */}
          <Section title={`Photos (${photos.length})`}>
            {photos.length === 0 ? (
              <p className="text-sm text-gray-400">No photos uploaded for this visit.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {photos.map((photo, idx) => (
                  <div key={idx} className="space-y-1.5">
                    {photo.url ? (
                      <a href={photo.url} target="_blank" rel="noopener noreferrer">
                        <img src={photo.url} alt={photo.type}
                          className="w-full h-32 object-cover rounded-xl border border-gray-100"/>
                      </a>
                    ) : (
                      <div className="w-full h-32 bg-gray-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-1.5">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <p className="text-[10px] text-gray-400">No image</p>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 font-medium text-center">{photo.type}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Follow-up details */}
          {followUpStatus && (
            <div className={`rounded-2xl border p-5 ${FOLLOWUP_COLOR[followUpStatus].split(" ")[0]}`}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3 opacity-70">Follow-up Details</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Status</span>
                  <span className="font-semibold">{FOLLOWUP_LABEL[followUpStatus]}</span>
                </div>
                {followUpDate && (
                  <div className="flex justify-between text-sm">
                    <span className="opacity-70">Reminder Date</span>
                    <span className="font-semibold">{formatDate(followUpDate)}</span>
                  </div>
                )}
                {visit.telecaller?.name && (
                  <div className="flex justify-between text-sm">
                    <span className="opacity-70">Assigned To</span>
                    <span className="font-semibold">{visit.telecaller.name}</span>
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      </div>
    </AdminLayout>
  );
}