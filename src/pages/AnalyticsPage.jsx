// FILE: src/pages/AnalyticsPage.jsx — OWNER: Naveen
// NOTE: Uses simple CSS bars for now. Replace with recharts when ready.
import AdminLayout from "../components/AdminLayout";
import StatCard    from "../components/StatCard";

const WEEK_DATA  = [42,38,55,48,61,34,28];
const WEEK_DAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const FOLLOWUP_D = [{ label:"Interested",     count:18, color:"bg-green-500"  },{ label:"Call Back",     count:12, color:"bg-blue-500"   },{ label:"Order Placed",  count:8,  color:"bg-purple-500" },{ label:"Payment Due",   count:7,  color:"bg-amber-500"  },{ label:"Not Interested",count:6,  color:"bg-red-400"    }];
const maxWeek    = Math.max(...WEEK_DATA);
const maxFollowup= Math.max(...FOLLOWUP_D.map(f=>f.count));

export default function AnalyticsPage() {
  return (
    <AdminLayout title="Analytics">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Visits (Week)" value={306}  sub="+12% vs last week"  color="blue"/>
        <StatCard label="Success Rate"        value="68%"  sub="Completed visits"   color="green"/>
        <StatCard label="Field Sales"         value={198}  sub="64% of total"       color="purple"/>
        <StatCard label="Collections"         value={108}  sub="36% of total"       color="amber"/>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Weekly visits bar chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Visits This Week</h2>
          <div className="flex items-end gap-3 h-40">
            {WEEK_DATA.map((val,i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <p className="text-[10px] text-gray-400">{val}</p>
                <div className="w-full bg-blue-500 rounded-t-lg transition-all" style={{height:`${(val/maxWeek)*130}px`}}/>
                <p className="text-[10px] text-gray-400">{WEEK_DAYS[i]}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Follow-up status breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h2 className="text-sm font-semibold text-gray-900 mb-4">Follow-up Breakdown</h2>
          <div className="space-y-3">
            {FOLLOWUP_D.map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-xs text-gray-600 mb-1">
                  <span>{item.label}</span>
                  <span className="font-medium">{item.count}</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2">
                  <div className={`${item.color} h-2 rounded-full transition-all`} style={{width:`${(item.count/maxFollowup)*100}%`}}/>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </AdminLayout>
  );
}