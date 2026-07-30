import React, { useState } from "react";
import { Edit2, Trash2, X, Save } from "lucide-react";

export type SkillCategoryEntry = { name: string; icon: string };

interface AdminSkillCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  predefinedSkillCategories: SkillCategoryEntry[];
  handleRenameSkillCategory: (oldName: string, newName: string, newIcon: string) => void;
  handleDeleteSkillCategory: (name: string) => void;
  handleAddSkillCategory: (name: string, icon: string) => void;
}

export default function AdminSkillCategoryModal({
  isOpen,
  onClose,
  predefinedSkillCategories,
  handleRenameSkillCategory,
  handleDeleteSkillCategory,
  handleAddSkillCategory
}: AdminSkillCategoryModalProps) {
  const [editingCategory, setEditingCategory] = useState<{old: string, new: string, icon: string} | null>(null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryIcon, setNewCategoryIcon] = useState("");

  if (!isOpen) return null;

  const onAddClick = () => {
    handleAddSkillCategory(newCategoryName, newCategoryIcon);
    setNewCategoryName("");
    setNewCategoryIcon("");
  };

  const onRenameClick = (oldName: string, newName: string, newIcon: string) => {
    handleRenameSkillCategory(oldName, newName, newIcon);
    setEditingCategory(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-zinc-900 border border-zinc-800 rounded-lg w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        <div className="px-6 py-4 border-b border-zinc-800 flex justify-between items-center bg-zinc-950">
          <h2 className="text-lg font-semibold">Manage Skill Categories</h2>
          <button onClick={onClose} className="p-1 text-zinc-400 hover:text-white rounded-md hover:bg-zinc-800 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <div className="space-y-3 mb-6">
            {predefinedSkillCategories.map(cat => (
              <div key={cat.name} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-md bg-zinc-950 border border-zinc-800 gap-2">
                {editingCategory?.old === cat.name ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="text"
                      value={editingCategory.new}
                      onChange={(e) => setEditingCategory({ ...editingCategory, new: e.target.value })}
                      className="flex-1 px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-sm focus:outline-none min-w-[100px]"
                    />
                    <input
                      type="text"
                      value={editingCategory.icon}
                      onChange={(e) => setEditingCategory({ ...editingCategory, icon: e.target.value })}
                      placeholder="icon slug"
                      className="w-24 px-2 py-1.5 rounded bg-zinc-900 border border-zinc-700 text-sm focus:outline-none"
                    />
                    <button onClick={() => onRenameClick(editingCategory.old, editingCategory.new, editingCategory.icon)} className="p-1.5 bg-zinc-100 text-zinc-900 rounded hover:bg-zinc-300">
                      <Save size={14} />
                    </button>
                    <button onClick={() => setEditingCategory(null)} className="p-1.5 bg-zinc-800 text-zinc-400 rounded hover:text-white">
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      {cat.icon && (
                        <img
                          src={`https://cdn.simpleicons.org/${cat.icon}`}
                          alt=""
                          className="w-4 h-4 object-contain"
                          onError={(e) => (e.currentTarget.style.visibility = "hidden")}
                        />
                      )}
                      <span className="text-sm font-medium">{cat.name}</span>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditingCategory({ old: cat.name, new: cat.name, icon: cat.icon })} className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-zinc-800" title="Edit">
                        <Edit2 size={14} />
                      </button>
                      <button onClick={() => handleDeleteSkillCategory(cat.name)} className="p-1.5 text-zinc-400 hover:text-red-400 rounded hover:bg-zinc-800" title="Delete">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
            {predefinedSkillCategories.length === 0 && <p className="text-sm text-zinc-500 text-center py-4">No predefined categories.</p>}
          </div>

          <div className="border-t border-zinc-800 pt-4">
            <label className="block text-sm text-zinc-400 mb-2">Add New Skill Category</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Distributed Systems"
                className="flex-[2] px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-sm focus:border-zinc-600 focus:outline-none min-w-[120px]"
                onKeyDown={(e) => e.key === 'Enter' && onAddClick()}
              />
              <input
                type="text"
                value={newCategoryIcon}
                onChange={(e) => setNewCategoryIcon(e.target.value)}
                placeholder="icon slug (simpleicons.org)"
                className="flex-1 px-3 py-2 rounded-md bg-zinc-950 border border-zinc-800 text-sm focus:border-zinc-600 focus:outline-none min-w-[120px]"
                onKeyDown={(e) => e.key === 'Enter' && onAddClick()}
              />
              <button onClick={onAddClick} className="px-4 py-2 bg-zinc-800 text-white rounded-md text-sm font-medium hover:bg-zinc-700">Add</button>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">Used as a fallback icon for skills in this category whose own icon fails to load. Find slugs at <a href="https://simpleicons.org" target="_blank" className="underline hover:text-blue-400">simpleicons.org</a></p>
          </div>
        </div>
      </div>
    </div>
  );
}
