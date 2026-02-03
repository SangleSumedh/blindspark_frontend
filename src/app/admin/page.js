"use client";

import { useEffect, useState } from "react";
import { collection, query, orderBy, getDocs, doc, updateDoc, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

export default function AdminDashboard() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch pending reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "reports"), 
        where("status", "==", "pending_review"),
        orderBy("timestamp", "desc")
      );
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setReports(data);
    } catch (error) {
      console.error("Error fetching reports:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // Ban User Action
  const handleBan = async (userId, reportId) => {
    if (!confirm("Are you sure you want to BAN this user? This cannot be undone easily.")) return;

    try {
      // 1. Ban the user
      // Note: In a real app, you might want to ban by IP or device ID too
      // But for now, we just flag the user document
      if (userId) {
         await updateDoc(doc(db, "users", userId), {
            isBanned: true
         });
      }

      // 2. Resolve the report
      await updateDoc(doc(db, "reports", reportId), {
        status: "banned",
        resolvedAt: new Date().toISOString()
      });

      // Refresh
      fetchReports();
    } catch (error) {
      console.error("Error banning user:", error);
      alert("Failed to ban user.");
    }
  };

  // Dismiss Action
  const handleDismiss = async (reportId) => {
    try {
       await updateDoc(doc(db, "reports", reportId), {
        status: "dismissed",
        resolvedAt: new Date().toISOString()
      });
      fetchReports();
    } catch (error) {
      console.error("Error dismissing report:", error);
    }
  };

  if (loading) {
     return <div className="text-center py-20 text-zinc-500">Loading reports...</div>;
  }

  return (
    <div className="space-y-8">
      
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-zinc-900 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-3xl text-red-500">{reports.length}</CardTitle>
            <CardDescription>Pending Reports</CardDescription>
          </CardHeader>
        </Card>
        {/* Placeholder stats */}
        <Card className="bg-zinc-900 border-zinc-800 opacity-50">
           <CardHeader>
              <CardTitle className="text-3xl text-zinc-300">--</CardTitle>
              <CardDescription>Total Users</CardDescription>
           </CardHeader>
        </Card>
        <Card className="bg-zinc-900 border-zinc-800 opacity-50">
           <CardHeader>
              <CardTitle className="text-3xl text-zinc-300">--</CardTitle>
              <CardDescription>Active Bans</CardDescription>
           </CardHeader>
        </Card>
      </div>

      <h2 className="text-2xl font-bold mt-8 mb-4 border-b border-zinc-800 pb-2">User Reports</h2>

      {reports.length === 0 ? (
        <div className="text-center py-20 bg-zinc-900/50 rounded-2xl border border-zinc-800 border-dashed">
           <p className="text-zinc-500">All clear! No pending reports. 🎉</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="bg-zinc-900 border-zinc-800 flex flex-col">
              {/* Evidence Snapshot */}
              <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4 border border-zinc-800 group">
                {report.evidenceUrl ? (
                   <img 
                      src={report.evidenceUrl} 
                      alt="Evidence" 
                      className="w-full h-full object-contain"
                   />
                ) : (
                   <div className="flex items-center justify-center h-full text-zinc-600 text-sm italic">
                      No Screenshot Available
                   </div>
                )}
                <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase">
                   {report.reason}
                </div>
              </div>

              <CardContent className="flex-1 space-y-2">
                 <div className="text-xs text-zinc-500 font-mono">
                    ID: {report.id}
                 </div>
                 <p className="text-sm text-zinc-300">
                    <span className="font-bold text-zinc-400">Details: </span>
                    {report.description || "No description provided."}
                 </p>
                 <div className="text-xs text-zinc-500 mt-2">
                    Reported by: {report.reporterEmail} <br/>
                    {report.timestamp?.seconds ? new Date(report.timestamp.seconds * 1000).toLocaleString() : "Just now"}
                 </div>
              </CardContent>

              <CardFooter className="grid grid-cols-2 gap-3 mt-auto">
                 <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDismiss(report.id)}
                    className="w-full text-zinc-400 hover:text-white"
                 >
                    Dismiss
                 </Button>
                 {/* Note: We don't have the reported user ID in all reports yet because we didn't store it in Phase 1. 
                     Future reports will have 'reportedUserId'. For now buttons might fail if ID missing. */}
                 <Button 
                    variant="danger" 
                    size="sm"
                    onClick={() => handleBan(report.reportedUserId, report.id)} // We need to ensure we capture reportedUserId!
                    className="w-full bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border-red-500/20"
                 >
                    🔨 Ban User
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
