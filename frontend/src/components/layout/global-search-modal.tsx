"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  Users,
  Building2,
  Calendar,
  Clock,
  CreditCard,
  FileText,
  Laptop,
  FolderKanban,
  X,
  Command,
  ChevronRight,
} from "lucide-react";

interface SearchItem {
  id: string;
  title: string;
  category: "Employees" | "Departments" | "Leave" | "Overtime" | "Payroll" | "Assets" | "Documents" | "Reports";
  url: string;
  icon: any;
}

const mockSearchItems: SearchItem[] = [
  { id: "1", title: "Employees Management", category: "Employees", url: "/admin/users", icon: Users },
  { id: "2", title: "Departments Overview", category: "Departments", url: "/admin/departments", icon: Building2 },
  { id: "3", title: "Leave Approvals & Balances", category: "Leave", url: "/admin/leave", icon: Calendar },
  { id: "4", title: "Overtime Requests & Analytics", category: "Overtime", url: "/admin/overtime", icon: Clock },
  { id: "5", title: "Payroll Processing & Payslips", category: "Payroll", url: "/admin/payroll", icon: CreditCard },
  { id: "6", title: "Hardware Asset Inventory", category: "Assets", url: "/admin/assets", icon: Laptop },
  { id: "7", title: "Document Vault & Policies", category: "Documents", url: "/admin/documents", icon: FolderKanban },
  { id: "8", title: "Reports & Executive Analytics", category: "Reports", url: "/admin/reports", icon: FileText },
  { id: "9", title: "Jane Smith (EMP003)", category: "Employees", url: "/admin/users", icon: Users },
  { id: "10", title: "John Doe (EMP002)", category: "Employees", url: "/admin/users", icon: Users },
  { id: "11", title: "Engineering Department", category: "Departments", url: "/admin/departments", icon: Building2 },
];

export function GlobalSearchModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        if (isOpen) onClose();
        else setQuery("");
      }
      if (!isOpen) return;

      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  const filteredItems = mockSearchItems.filter(
    (item) =>
      item.title.toLowerCase().includes(query.toLowerCase()) ||
      item.category.toLowerCase().includes(query.toLowerCase())
  );

  const handleSelect = (url: string) => {
    router.push(url);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-gray-200 dark:border-slate-800 overflow-hidden">
        {/* Search Header Input */}
        <div className="p-4 border-b border-gray-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="h-5 w-5 text-gray-400 dark:text-gray-500 shrink-0" />
          <Input
            autoFocus
            placeholder="Search employees, departments, payroll, leave, documents (Ctrl + K)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border-0 focus-visible:ring-0 text-sm dark:bg-slate-900 dark:text-white"
          />
          <Badge variant="secondary" className="text-[10px] font-mono shrink-0">
            ESC to close
          </Badge>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Results List */}
        <div className="max-h-96 overflow-y-auto p-2">
          {filteredItems.length ? (
            <div className="space-y-1">
              {filteredItems.map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelect(item.url)}
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 dark:hover:bg-slate-800/80 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-lg bg-gray-100 dark:bg-slate-800 p-2 text-blue-600 dark:text-blue-400">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-gray-900 dark:text-white">{item.title}</p>
                        <p className="text-[10px] text-gray-500 dark:text-gray-400">{item.category}</p>
                      </div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-gray-500">
              No matching HRMS resources found for "{query}".
            </div>
          )}
        </div>

        {/* Search Footer */}
        <div className="p-3 bg-gray-50 dark:bg-slate-950 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center text-[10px] text-gray-400">
          <span className="flex items-center gap-1">
            <Command className="h-3 w-3" /> Quick Jump Search
          </span>
          <span>Press Enter to select</span>
        </div>
      </div>
    </div>
  );
}
