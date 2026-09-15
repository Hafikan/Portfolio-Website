import React from "react";
import { X, Save } from "lucide-react";

// Form state: highlights are one bullet per line, tech is comma-separated.
// The API normalizes both into arrays (src/lib/experience.ts).
export type ExperienceForm = {
  company: string;
  role: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
  highlights: string;
  tech: string;
};

export const EMPTY_EXPERIENCE_FORM: ExperienceForm = {
  company: "",
  role: "",
  location: "",
  startDate: "",
  endDate: "",
  current: false,
  highlights: "",
  tech: "",
};

interface AdminExperienceModalProps {
  isOpen: boolean;
  onClose: () => void;
  editingExperienceId: string | null;
  newExperience: ExperienceForm;
  setNewExperience: (entry: ExperienceForm) => void;
  handleSaveExperience: (e: React.FormEvent) => void;
  loading: boolean;
}

const inputClass =
  "w-full px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 focus:border-zinc-600 focus:outline-none transition-colors";

export default function AdminExperienceModal({
  isOpen,
  onClose,
  editingExperienceId,
  newExperience,
  setNewExperience,
  handleSaveExperience,
  loading,
}: AdminExperienceModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-lg max-h-[90vh] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h2 className="text-lg font-semibold">{editingExperienceId ? "Edit Experience" : "Add New Experience"}</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto">
          <form id="experience-form" onSubmit={handleSaveExperience} className="space-y-4 text-sm">
            <div>
              <label className="block text-zinc-400 mb-1">Company</label>
              <input
                type="text"
                value={newExperience.company}
                onChange={(e) => setNewExperience({ ...newExperience, company: e.target.value })}
                className={inputClass}
                placeholder="e.g., Acme Aerospace"
                required
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Role</label>
              <input
                type="text"
                value={newExperience.role}
                onChange={(e) => setNewExperience({ ...newExperience, role: e.target.value })}
                className={inputClass}
                placeholder="e.g., Senior Software Engineer"
                required
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Location / Work Type</label>
              <input
                type="text"
                value={newExperience.location}
                onChange={(e) => setNewExperience({ ...newExperience, location: e.target.value })}
                className={inputClass}
                placeholder="e.g., Ankara, TR · Hybrid"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-zinc-400 mb-1">Start</label>
                <input
                  type="month"
                  value={newExperience.startDate}
                  onChange={(e) => setNewExperience({ ...newExperience, startDate: e.target.value })}
                  className={`${inputClass} [color-scheme:dark]`}
                  required
                />
              </div>
              <div>
                <label className="block text-zinc-400 mb-1">End</label>
                <input
                  type="month"
                  value={newExperience.current ? "" : newExperience.endDate}
                  min={newExperience.startDate || undefined}
                  onChange={(e) => setNewExperience({ ...newExperience, endDate: e.target.value })}
                  className={`${inputClass} [color-scheme:dark] disabled:opacity-40`}
                  disabled={newExperience.current}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="experience-current"
                checked={newExperience.current}
                onChange={(e) => setNewExperience({ ...newExperience, current: e.target.checked, endDate: e.target.checked ? "" : newExperience.endDate })}
                className="w-4 h-4 rounded border-zinc-800 bg-zinc-950 checked:bg-zinc-100"
              />
              <label htmlFor="experience-current" className="text-zinc-400 cursor-pointer">I currently work here</label>
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Highlights</label>
              <textarea
                value={newExperience.highlights}
                onChange={(e) => setNewExperience({ ...newExperience, highlights: e.target.value })}
                className={`${inputClass} min-h-32 resize-y`}
                placeholder={"One bullet per line\ne.g., Built a low-latency telemetry pipeline"}
              />
            </div>
            <div>
              <label className="block text-zinc-400 mb-1">Tech</label>
              <input
                type="text"
                value={newExperience.tech}
                onChange={(e) => setNewExperience({ ...newExperience, tech: e.target.value })}
                className={inputClass}
                placeholder="e.g., Qt, C++, Docker"
              />
              <p className="text-[10px] text-zinc-500 mt-1">Comma-separated</p>
            </div>
          </form>
        </div>

        <div className="px-6 py-4 border-t border-zinc-800 bg-zinc-950 flex justify-end gap-3">
          <button type="button" onClick={onClose} className="px-4 py-2 rounded-md bg-zinc-800 text-zinc-300 font-medium hover:bg-zinc-700 transition-colors text-sm border border-zinc-700">Cancel</button>
          <button type="submit" form="experience-form" disabled={loading} className="px-4 py-2 rounded-md bg-zinc-100 text-zinc-900 font-medium hover:bg-zinc-200 transition-colors text-sm disabled:opacity-50 flex items-center gap-2">
            <Save size={14} /> {editingExperienceId ? "Update" : "Save"}
          </button>
        </div>
      </div>
    </div>
  );
}
