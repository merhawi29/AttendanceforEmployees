"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/auth-context";
import { apiRequest } from "@/lib/api";
import { User, CreditCard, QrCode, LogOut, ShieldCheck, Download, Building2 } from "lucide-react";

interface Payslip {
  id: string;
  month: number;
  year: number;
  grossSalary: number;
  netSalary: number;
  totalDeductions: number;
  status: string;
}

export default function MobileProfilePage() {
  const { user, logout } = useAuth();
  const [payslips, setPayslips] = useState<Payslip[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const data = await apiRequest<Payslip[]>("/payroll/my-payslips");
      setPayslips(data);
    } catch (err) {
      console.error("Failed to load mobile payslips", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <MobileLayout>
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              <User className="h-5 w-5 text-amber-600" /> Digital Profile & ID
            </h2>
            <p className="text-xs text-gray-500">Corporate credential & monthly payslips</p>
          </div>

          {/* Digital Employee ID Card */}
          <div className="rounded-3xl bg-gradient-to-tr from-gray-900 via-gray-800 to-indigo-950 p-5 text-white shadow-xl relative overflow-hidden border border-gray-700">
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <Building2 className="h-6 w-6 text-blue-400" />
                <span className="font-extrabold text-sm tracking-wider">AttendPro HRMS</span>
              </div>
              <Badge className="bg-emerald-500 text-white text-[9px] uppercase tracking-widest font-bold">
                VERIFIED ID
              </Badge>
            </div>

            <div className="mt-5 flex items-center gap-4">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-xl font-bold text-white border-2 border-white/20 shadow-md">
                {user?.name?.slice(0, 2).toUpperCase() || "EP"}
              </div>
              <div>
                <h3 className="text-base font-bold leading-tight">{user?.name}</h3>
                <p className="text-xs text-indigo-200 mt-0.5">
                  {typeof user?.position === "string" ? user.position : "Employee"} · {user?.department || "General"}
                </p>
                <p className="text-[11px] font-mono text-gray-300 mt-1 tracking-widest">{user?.employeeId}</p>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[9px] uppercase tracking-wider text-gray-400 block">Security Status</span>
                <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="h-3.5 w-3.5" /> Active Credential
                </span>
              </div>
              <div className="bg-white p-1.5 rounded-lg shadow-sm">
                <QrCode className="h-9 w-9 text-gray-900" />
              </div>
            </div>
          </div>

          {/* Monthly Payslips Viewer */}
          <Card className="border-0 shadow-sm bg-white rounded-2xl">
            <CardHeader className="p-3.5 pb-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-amber-600" /> Recent Payslips
              </CardTitle>
              <Badge variant="secondary" className="text-[10px]">
                Currency: ETB
              </Badge>
            </CardHeader>
            <CardContent className="p-3.5 pt-0">
              {payslips.length ? (
                <div className="space-y-2.5">
                  {payslips.map((p) => (
                    <div key={p.id} className="rounded-xl border p-3 text-xs bg-gray-50 space-y-1.5">
                      <div className="flex justify-between items-center font-bold text-gray-900">
                        <span>{new Date(p.year, p.month - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                        <span className="text-emerald-700">{p.netSalary.toLocaleString()} ETB</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-gray-500 pt-1 border-t">
                        <div>Gross: <span className="font-semibold text-gray-800">{p.grossSalary.toLocaleString()} ETB</span></div>
                        <div>Deductions: <span className="font-semibold text-red-600">-{p.totalDeductions.toLocaleString()} ETB</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center py-6 text-xs text-gray-500">No payslips generated for current period.</p>
              )}
            </CardContent>
          </Card>

          {/* Account Logout Action */}
          <Button
            onClick={logout}
            variant="outline"
            className="w-full h-10 border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 rounded-2xl text-xs font-bold"
          >
            <LogOut className="mr-2 h-4 w-4" /> Log Out of Mobile App
          </Button>
        </div>
      </MobileLayout>
    </ProtectedRoute>
  );
}
