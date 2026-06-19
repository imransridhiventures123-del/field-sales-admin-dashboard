// FILE: src/pages/VisitDetailPage.jsx
// OWNER: Naveen
// PURPOSE: Full detail of a single visit in the admin dashboard
//   - Shop info (name, code, owner, mobile, address, field type)
//   - Employee who did the visit
//   - Visit status + follow-up status + follow-up date
//   - GPS location with Google Maps link
//   - Photos grid (shop front, product display, additional)
//   - Telecaller assignment info
//
// ADD ROUTE in App.jsx:
//   import VisitDetailPage from "./pages/VisitDetailPage";
//   <Route path="/all-visits/:id" element={<AdminPrivateRoute><VisitDetailPage /></AdminPrivateRoute>} />

import { useNavigate, useParams } from "react-router-dom";
import AdminLayout from "../components/AdminLayout";
import { formatDateTime, formatDate, STATUS_COLOR, FOLLOWUP_LABEL, FOLLOWUP_COLOR } from "../utils/helpers";

// ── DUMMY DATA — replace with getVisitById(id) API call ──
const DUMMY_VISITS = {
  "v1": {
    _id:         "v1",
    shopName:    "Annas Provision Store",
    shopCode:    "AP001",
    ownerName:   "Annas",
    mobile:      "9876540001",
    fieldType:   "Field Sales",
    address:     "123 Main Street, Adyar, Chennai - 600020",
    latitude:    13.0082,
    longitude:   80.2574,
    status:      "Completed",
    followUpStatus: "interested",
    followUpDate:   null,
    photos: [
      { type: "Shop Front",       url: null },
      { type: "Product Display",  url: null },
    ],
    employee: { _id:"e1", name:"Rakesh Kumar", employeeId:"EMP001", mobile:"9876543210" },
    telecaller: { name:"Priya R", phone:"8925864472" },
    createdAt: new Date(Date.now() - 7200000).toISOString(),
    submittedAt: new Date(Date.now() - 7100000).toISOString(),
  },
  "v2": {
    _id:         "v2",
    shopName:    "Big Bazaar",
    shopCode:    "BB001",
    ownerName:   "Ravi Kumar",
    mobile:      "9876540002",
    fieldType:   "Collection",
    address:     "456 Anna Salai, Teynampet, Chennai - 600018",
    latitude:    13.0418,
    longitude:   80.2341,
    status:      "Completed",
    followUpStatus: "payment_due",
    followUpDate:   new Date(Date.now() + 172800000).toISOString().split("T")[0],
    photos: [
      { type: "Shop Front",       url: null },
      { type: "Product Display",  url: null },
      { type: "Additional",       url: null },
    ],
    employee: { _id:"e2", name:"Naveen S", employeeId:"EMP002", mobile:"9876543211" },
    telecaller: { name:"Divya S", phone:"9876541002" },
    createdAt: new Date(Date.now() - 5400000).toISOString(),
    submittedAt: new Date(Date.now() - 5200000).toISOString(),
  },
  "v3": {
    _id:         "v3",
    shopName:    "Sri Murugan Stores",
    shopCode:    "SM001",
    ownerName:   "Murugan",
    mobile:      "9876540003",
    fieldType:   "Field Sales",
    address:     "789 Gandhi Road, T Nagar, Chennai - 600017",
    latitude:    13.0339,
    longitude:   80.2185,
    status:      "Pending",
    followUpStatus: "callback",
    followUpDate:   new Date(Date.now() + 86400000).toISOString().split("T")[0],
    photos: [],
    employee: { _id:"e3", name:"Divya R", employeeId:"EMP003", mobile:"9876543213" },
    telecaller: null,
    createdAt: new Date(Date.now() - 3600000).toISOString(),
    submittedAt: new Date(Date.now() - 3500000).toISOString(),
  },
  "v4": {
    _id:         "v4",
    shopName:    "Kumar Stores",
    shopCode:    "KS001",
    ownerName:   "Suresh Kumar",
    mobile:      "9876540004",
    fieldType:   "Collection",
    address:     "12 West Mambalam, Chennai - 600033",
    latitude:    13.0390,
    longitude:   80.2300,
    status:      "Completed",
    followUpStatus: "order_placed",
    followUpDate:   null,
    photos: [
      { type: "Shop Front",       url: null },
      { type: "Product Display",  url: null },
    ],
    employee: { _id:"e5", name:"Priya S", employeeId:"EMP005", mobile:"9876543215" },
    telecaller: { name:"Lakshmi P", phone:"9876541004" },
    createdAt: new Date(Date.now() - 1800000).toISOString(),
    submittedAt: new Date(Date.now() - 1700000).toISOString(),
  },
  "v5": {
    _id:         "v5",
    shopName:    "Daily Fresh Mart",
    shopCode:    "DF001",
    ownerName:   "Rajan",
    mobile:      "9876540005",
    fieldType:   "Field Sales",
    address:     "55 North Usman Road, T Nagar, Chennai - 600017",
    latitude:    13.0674,
    longitude:   80.2376,
    status:      "Rejected",
    followUpStatus: "not_interested",
    followUpDate:   null,
    photos: [
      { type: "Shop Front", url: null },
    ],
    employee: { _id:"e6", name:"Rajan M", employeeId:"EMP006", mobile:"9876543216" },
    telecaller: null,
    createdAt: new Date(Date.now() - 900000).toISOString(),
    submittedAt: new Date(Date.now() - 800000).toISOString(),
  },
};

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
  const visit    = DUMMY_VISITS[id];

  if (!visit) {
    return (
      <AdminLayout title="Visit Detail">
        <div className="text-center py-20">
          <p className="text-gray-400 text-lg">Visit not found.</p>
          <button onClick={() => navigate("/all-visits")} className="mt-4 text-blue-600 text-sm font-medium">← Back to All Visits</button>
        </div>
      </AdminLayout>
    );
  }

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
            <p className="text-sm text-gray-400 mt-0.5 font-mono">{visit.shopCode}</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {/* Visit status */}
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${STATUS_COLOR[visit.status]}`}>
              {visit.status}
            </span>
            {/* Follow-up status */}
            {visit.followUpStatus && (
              <span className={`text-xs font-semibold px-3 py-1.5 rounded-full ${FOLLOWUP_COLOR[visit.followUpStatus]}`}>
                {FOLLOWUP_LABEL[visit.followUpStatus]}
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
            Visit started: {formatDateTime(visit.createdAt)}
          </span>
          <span className="flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            Submitted: {formatDateTime(visit.submittedAt)}
          </span>
          {visit.followUpDate && (
            <span className="flex items-center gap-1.5 text-amber-600 font-medium">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
              Follow-up due: {formatDate(visit.followUpDate)}
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
            <InfoRow label="Shop Contact Number"   value={visit.shopCode}  mono />
            <InfoRow label="Owner Name"  value={visit.ownerName} />
            <InfoRow label="Contact No." value={`+91 ${visit.mobile}`} color="text-blue-600" />
            <InfoRow label="Field Type"  value={visit.fieldType} />
            <InfoRow label="Address"     value={visit.address}   />
          </Section>

          {/* Employee Info */}
          <Section title="Field Employee">
            <div
              onClick={() => navigate(`/sales-team/${visit.employee._id}`)}
              className="flex items-center gap-4 p-3 rounded-xl hover:bg-blue-50 cursor-pointer transition -mx-1"
            >
              <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-bold text-sm flex-shrink-0">
                {visit.employee.name.split(" ").map(n=>n[0]).join("").slice(0,2)}
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
          </Section>

          {/* Telecaller assigned */}
          <Section title="Assigned Telecaller">
            {visit.telecaller ? (
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
          <Section title={`Photos (${visit.photos.length})`}>
            {visit.photos.length === 0 ? (
              <p className="text-sm text-gray-400">No photos uploaded for this visit.</p>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {visit.photos.map((photo, idx) => (
                  <div key={idx} className="space-y-1.5">
                    {photo.url ? (
                      <img src={photo.url} alt={photo.type}
                        className="w-full h-32 object-cover rounded-xl border border-gray-100"/>
                    ) : (
                      // Placeholder when no real photo yet
                      <div className="w-full h-32 bg-gray-100 rounded-xl border border-gray-200 flex flex-col items-center justify-center gap-1.5">
                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"/>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        <p className="text-[10px] text-gray-400">Photo uploaded</p>
                      </div>
                    )}
                    <p className="text-[11px] text-gray-500 font-medium text-center">{photo.type}</p>
                  </div>
                ))}
              </div>
            )}
          </Section>

          {/* Follow-up details */}
          {visit.followUpStatus && (
            <div className={`rounded-2xl border p-5 ${FOLLOWUP_COLOR[visit.followUpStatus].replace("text-","border-").split(" ")[0].replace("bg-","border-")} ${FOLLOWUP_COLOR[visit.followUpStatus].split(" ")[0]}`}>
              <p className="text-xs font-semibold uppercase tracking-wide mb-3 opacity-70">Follow-up Details</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="opacity-70">Status</span>
                  <span className="font-semibold">{FOLLOWUP_LABEL[visit.followUpStatus]}</span>
                </div>
                {visit.followUpDate && (
                  <div className="flex justify-between text-sm">
                    <span className="opacity-70">Reminder Date</span>
                    <span className="font-semibold">{formatDate(visit.followUpDate)}</span>
                  </div>
                )}
                {visit.telecaller && (
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
