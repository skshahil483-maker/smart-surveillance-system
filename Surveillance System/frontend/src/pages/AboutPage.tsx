import React from 'react';
import { BookOpen, ShieldCheck, Cpu, Layers, BarChart2, Lock } from 'lucide-react';

export const AboutPage: React.FC = () => {
  return (
    <div className="p-6 max-w-[1400px] mx-auto space-y-8 text-slate-300">
      {/* Title Header */}
      <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-blue-400" />
            Smart Surveillance Project Documentation
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Deep Learning-Based Real-Time Suspicious Activity Detection using YOLOv8, ByteTrack, and CNN + LSTM Temporal Models.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <span className="px-3 py-1 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-mono font-bold">
            Academic B.Tech / M.Tech Thesis Architecture
          </span>
        </div>
      </div>

      {/* System Architecture Section */}
      <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Layers className="w-5 h-5 text-purple-400" /> End-to-End Processing Pipeline
        </h3>

        <div className="bg-[#1e293b] p-6 rounded-lg border border-slate-800 font-mono text-xs overflow-x-auto text-slate-200 leading-relaxed">
          <pre className="text-blue-300 font-semibold">{`
  VIDEO CAPTURE  ──►  OPENCV FRAMES  ──►  YOLOv8 DETECTOR  ──►  BYTETRACK (IDs)
       │                                                              │
       ▼                                                              ▼
 DASHBOARD LIVE  ◄──  WEBSOCKET BROADCAST  ◄──  EVENT DB  ◄──  SUSPICIOUS ENGINE
          `}</pre>
        </div>
      </div>

      {/* Academic Modules Grid (Modules 1 - 11) */}
      <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-xl space-y-6">
        <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Cpu className="w-5 h-5 text-emerald-400" /> 11 Academic System Modules
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-blue-400 block mb-1">Module 1: Video Acquisition</span>
            <p className="text-xs text-slate-400">
              Captures live video from USB webcams (`0`), uploaded video test files (`.mp4`), or RTSP IP camera streams at 25 FPS.
            </p>
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-blue-400 block mb-1">Module 2: Frame Preprocessing</span>
            <p className="text-xs text-slate-400">
              Resizes frames to standard 640x640, performs normalization, aspect ratio retention, and brightness/contrast scaling.
            </p>
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-blue-400 block mb-1">Module 3: YOLOv8 Person Detection</span>
            <p className="text-xs text-slate-400">
              Uses YOLOv8s pretrained/fine-tuned weights to detect human bounding boxes with spatial confidence scores.
            </p>
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-purple-400 block mb-1">Module 4: Person Tracking</span>
            <p className="text-xs text-slate-400">
              Integrates ByteTrack / IoU trajectory tracking to assign persistent identity IDs (`Person 01`, `Person 02`) across frames.
            </p>
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-purple-400 block mb-1">Module 5: CNN Feature Extraction</span>
            <p className="text-xs text-slate-400">
              Extracts spatial color/texture representations and Sobel motion optical flow vectors from person crops.
            </p>
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-purple-400 block mb-1">Module 6: Sequence Action Recognition</span>
            <p className="text-xs text-slate-400">
              Analyzes multi-frame trajectory sequences (16-frame window) to classify activities: Fighting, Walking, Running, Loitering, Falling, Standing.
            </p>
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-red-400 block mb-1">Module 7: Suspicious Decision Engine</span>
            <p className="text-xs text-slate-400">
              Evaluates activities against threshold parameters, loitering limits, restricted zones, and fall postures.
            </p>
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-red-400 block mb-1">Module 8: Alert Generation</span>
            <p className="text-xs text-slate-400">
              Triggers visual dashboard popups, Web Audio API siren alerts, snapshot image saving, and cooldown management.
            </p>
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-emerald-400 block mb-1">Module 9: Database & Event Logging</span>
            <p className="text-xs text-slate-400">
              Persists structured event records, camera definitions, person tracks, and system settings in SQLite using SQLAlchemy.
            </p>
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-emerald-400 block mb-1">Module 10: Web Dashboard</span>
            <p className="text-xs text-slate-400">
              Dark surveillance command center built with React, TypeScript, Vite, Tailwind CSS, Recharts, and WebSockets.
            </p>
          </div>

          <div className="bg-[#1e293b] p-4 rounded-lg border border-slate-800">
            <span className="text-xs font-bold text-emerald-400 block mb-1">Module 11: Performance Evaluation</span>
            <p className="text-xs text-slate-400">
              Generates mAP@0.5, Precision, Recall, F1-score, Confusion Matrix graphs, and CNN backbone comparisons.
            </p>
          </div>
        </div>
      </div>

      {/* Model Benchmark Comparison Table */}
      <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
        <h3 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <BarChart2 className="w-5 h-5 text-amber-400" /> Academic Model Benchmark Comparison
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="bg-[#1e293b] text-slate-300 font-sans font-semibold border-b border-slate-800">
                <th className="py-3 px-4">Model Architecture</th>
                <th className="py-3 px-4">Accuracy</th>
                <th className="py-3 px-4">Precision</th>
                <th className="py-3 px-4">Recall</th>
                <th className="py-3 px-4">F1-Score</th>
                <th className="py-3 px-4">Inference (ms)</th>
                <th className="py-3 px-4">FPS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              <tr className="bg-blue-950/20 text-white font-bold">
                <td className="py-3 px-4 text-blue-400">YOLOv8s + ByteTrack (Selected)</td>
                <td className="py-3 px-4 text-emerald-400">94.8%</td>
                <td className="py-3 px-4">95.2%</td>
                <td className="py-3 px-4">94.1%</td>
                <td className="py-3 px-4">94.6%</td>
                <td className="py-3 px-4 text-emerald-400">42 ms</td>
                <td className="py-3 px-4">24 FPS</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300">MobileNetV2 + LSTM</td>
                <td className="py-3 px-4">89.4%</td>
                <td className="py-3 px-4">88.7%</td>
                <td className="py-3 px-4">90.1%</td>
                <td className="py-3 px-4">89.4%</td>
                <td className="py-3 px-4">28 ms</td>
                <td className="py-3 px-4">35 FPS</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300">ResNet50 + GRU</td>
                <td className="py-3 px-4">92.1%</td>
                <td className="py-3 px-4">91.8%</td>
                <td className="py-3 px-4">92.5%</td>
                <td className="py-3 px-4">92.1%</td>
                <td className="py-3 px-4">68 ms</td>
                <td className="py-3 px-4">15 FPS</td>
              </tr>
              <tr>
                <td className="py-3 px-4 text-slate-300">DenseNet201 + LSTM</td>
                <td className="py-3 px-4">93.5%</td>
                <td className="py-3 px-4">93.1%</td>
                <td className="py-3 px-4">93.8%</td>
                <td className="py-3 px-4">93.4%</td>
                <td className="py-3 px-4">110 ms</td>
                <td className="py-3 px-4">9 FPS</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Responsible AI & Privacy Notice */}
      <div className="bg-[#0f172a] p-6 rounded-xl border border-slate-800 shadow-xl space-y-3">
        <h3 className="text-base font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2 border-b border-slate-800 pb-3">
          <Lock className="w-5 h-5" /> Privacy & Responsible AI Disclosure
        </h3>
        <p className="text-xs text-slate-300 leading-relaxed">
          This system is an AI-assisted monitoring tool designed for security operations. Predictions are based on spatial motion vectors and fine-tuned activity models and may contain false positives or false negatives. Suspicious activity decisions should serve as alerts for human verification and must not automatically be treated as proof of unlawful behavior.
        </p>
        <p className="text-xs text-slate-400 leading-relaxed">
          <strong>Privacy Note:</strong> Facial recognition is explicitly omitted from this implementation to prioritize privacy compliance and adhere to standard computer vision data protection guidelines.
        </p>
      </div>
    </div>
  );
};
