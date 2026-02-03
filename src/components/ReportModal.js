"use client";

import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "./ui/Card";
import { Button } from "./ui/Button";

export default function ReportModal({ isOpen, onClose, remoteVideoRef, onReportSubmitted, reportedUserId }) {
  const { user } = useAuth();
  const [reason, setReason] = useState("inappropriate");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const captureFrame = () => {
    if (!remoteVideoRef.current) return null;
    try {
      const canvas = document.createElement("canvas");
      canvas.width = remoteVideoRef.current.videoWidth;
      canvas.height = remoteVideoRef.current.videoHeight;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(remoteVideoRef.current, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/jpeg", 0.5); 
    } catch (e) {
      console.error("Failed to capture frame:", e);
      return null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Capture evidence
      const snapshot = captureFrame();
      let evidenceUrl = null;

      if (snapshot) {
        // Upload to Cloudinary via our secure API route
        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ image: snapshot }),
        });
        
        const data = await uploadRes.json();
        if (data.url) {
          evidenceUrl = data.url;
        } else {
          console.error("Upload failed:", data.error);
        }
      }

      // Submit to Firestore
      await addDoc(collection(db, "reports"), {
        reporterId: user.uid,
        reporterEmail: user.email,
        reportedUserId: reportedUserId || null,
        reason,
        description,
        evidenceUrl: evidenceUrl,
        timestamp: serverTimestamp(),
        status: "pending_review",
      });

      onReportSubmitted();
      onClose();
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/80 backdrop-blur-sm p-4 animate-fade-in-up">
      <Card className="max-w-md w-full border-red-500/20 shadow-2xl bg-zinc-900">
        <form onSubmit={handleSubmit}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-500">
              <span className="text-2xl">🚩</span> Report User
            </CardTitle>
            <CardDescription>
              We take safety seriously. Please describe the issue.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Reason</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none"
              >
                <option value="inappropriate">Nudity / Inappropriate Content</option>
                <option value="harassment">Harassment / Bullying</option>
                <option value="spam">Spam / Advertising</option>
                <option value="underage">Underage User</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1">Description (Optional)</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Provide more details..."
                className="w-full bg-zinc-950 border border-zinc-700 rounded-xl p-3 text-zinc-100 focus:ring-2 focus:ring-red-500 outline-none resize-none"
              />
            </div>

            <div className="text-xs text-zinc-500 bg-zinc-900/50 p-2 rounded border border-zinc-800 flex items-center gap-2">
              <span>📸</span> A snapshot of the current video feed will be attached.
            </div>
          </CardContent>

          <CardFooter className="gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="danger"
              disabled={isSubmitting}
              className="flex-1"
            >
              {isSubmitting ? "Submitting..." : "Report & Skip"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
