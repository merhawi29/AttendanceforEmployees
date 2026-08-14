"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/api";
import { Employee } from "@/types/employee";
import { EmployeeModal } from "@/components/admin/employee-modal";
import { DeleteEmployeeModal } from "@/components/admin/delete-employee-modal";
import { Toaster } from "@/components/ui/toast";
import {
  ArrowLeft,
  User as UserIcon,
  Building2,
  Briefcase,
  Mail,
  Phone,
  Calendar,
  DollarSign,
  Shield,
  Laptop,
  CheckCircle2,
  XCircle,
  Edit,
  Trash2,
  Clock,
  MapPin,
  Users,
} from "lucide-react";

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params?.id as string;

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const fetchEmployeeDetails = useCallback(async () => {
    if (!employeeId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await apiRequest<Employee>(`/employees/${employeeId}`);
      setEmployee(data);
    } catch (err: any) {
      setError(err.message || "Failed to load employee profile");
    } finally {
      setLoading(false);
    }
  }, [employeeId]);

  useEffect(() => {
    fetchEmployeeDetails();
  }, [fetchEmployeeDetails]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-64 items-center justify-center text-gray-500">
          Loading employee details...
        </div>
      </DashboardLayout>
    );
  }

  if (error || !employee) {
    return (
      <DashboardLayout>
        <div className="space-y-4 text-center py-12">
          <p className="text-red-500">{error || "Employee not found"}</p>
          <Button variant="outline" onClick={() => router.push("/admin/users")}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Employee Directory
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Toaster />

        {/* Top Bar */}
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            onClick={() => router.push("/admin/users")}
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Directory
          </Button>

          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => setIsEditModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" /> Edit Profile
            </Button>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteModalOpen(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" /> Deactivate Employee
            </Button>
          </div>
        </div>

        {/* Employee Banner / Header Card */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-5">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-2xl font-bold text-white shadow-md">
                {employee.name.charAt(0).toUpperCase()}
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{employee.name}</h1>
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-xs font-semibold ${
                      employee.role === "ADMIN"
                        ? "bg-purple-100 text-purple-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    <Shield className="mr-1 h-3 w-3" />
                    {employee.role}
                  </span>
                </div>
                <p className="font-mono text-sm text-gray-500">
                  ID: <span className="font-semibold text-gray-700">{employee.employeeId}</span>
                </p>
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 pt-1">
                  <span className="flex items-center gap-1.5">
                    <Mail className="h-3.5 w-3.5 text-gray-400" />
                    {employee.email}
                  </span>
                  {employee.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-gray-400" />
                      {employee.phone}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-start gap-2 md:items-end">
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">Status:</span>
                {employee.isActive ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Active Account
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-700">
                    <XCircle className="h-3.5 w-3.5" /> Deactivated
                  </span>
                )}
              </div>

              {employee.employmentStatus && (
                <span className="inline-flex items-center gap-1.5 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  Employment Status: <strong className="uppercase">{employee.employmentStatus}</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* Left Column (2/3 width on desktop) */}
          <div className="space-y-6 md:col-span-2">
            {/* Card: Personal Details */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                <UserIcon className="h-5 w-5 text-blue-600" /> Personal Information
              </h2>
              <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">First Name</p>
                  <p className="font-medium text-gray-900">{employee.firstName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Middle Name</p>
                  <p className="font-medium text-gray-900">{employee.middleName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Last Name</p>
                  <p className="font-medium text-gray-900">{employee.lastName || "-"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Gender</p>
                  <p className="font-medium text-gray-900">{employee.gender || "Unspecified"}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Date of Birth</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {employee.dateOfBirth || "Not provided"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Residential Address</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-gray-400" />
                    {employee.address || "Not provided"}
                  </p>
                </div>
              </div>
            </div>

            {/* Card: Employment & Financial Information */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                <Briefcase className="h-5 w-5 text-indigo-600" /> Employment & Financial Details
              </h2>
              <div className="grid grid-cols-2 gap-4 pt-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Employment Type</p>
                  <p className="font-semibold text-gray-900">
                    {employee.employmentType ? employee.employmentType.replace("_", " ") : "FULL TIME"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hire Date</p>
                  <p className="font-medium text-gray-900 flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-gray-400" />
                    {employee.hireDate || "Not recorded"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Monthly Base Salary</p>
                  <p className="font-semibold text-green-700 flex items-center gap-1 text-base">
                    <DollarSign className="h-4 w-4" />
                    {employee.salary !== null && employee.salary !== undefined
                      ? employee.salary.toLocaleString(undefined, { minimumFractionDigits: 2 })
                      : "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Account Creation Date</p>
                  <p className="font-medium text-gray-900">
                    {new Date(employee.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </div>

            {/* Card: Recent Attendance Activity */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                <Clock className="h-5 w-5 text-purple-600" /> Recent Attendance History
              </h2>
              <div className="pt-4">
                {!employee.attendances || employee.attendances.length === 0 ? (
                  <p className="text-xs text-gray-500">No recent attendance records found.</p>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {employee.attendances.map((att) => (
                      <div key={att.id} className="flex items-center justify-between py-2.5 text-xs">
                        <div>
                          <p className="font-semibold text-gray-900">
                            {new Date(att.date).toLocaleDateString()} ({att.ethiopianDate})
                          </p>
                          <p className="text-gray-500">
                            In: {att.morningIn ? new Date(att.morningIn).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"} | 
                            Out: {att.finalOut ? new Date(att.finalOut).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "N/A"}
                          </p>
                        </div>
                        <span className="rounded bg-blue-50 px-2 py-0.5 font-medium text-blue-700">
                          {att.status || "PRESENT"}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column (1/3 width on desktop) */}
          <div className="space-y-6">
            {/* Card: Organization & Manager */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                <Building2 className="h-5 w-5 text-purple-600" /> Organizational Placement
              </h2>
              <div className="space-y-4 pt-4 text-sm">
                <div>
                  <p className="text-xs text-gray-500">Assigned Department</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1.5 pt-0.5">
                    <Building2 className="h-4 w-4 text-blue-600" />
                    {employee.departmentRef?.name || employee.department || "Unassigned"}
                  </p>
                  {employee.departmentRef?.code && (
                    <p className="text-xs text-gray-400 pl-5">Code: {employee.departmentRef.code}</p>
                  )}
                </div>

                <div>
                  <p className="text-xs text-gray-500">Job Position</p>
                  <p className="font-semibold text-gray-900 flex items-center gap-1.5 pt-0.5">
                    <Briefcase className="h-4 w-4 text-purple-600" />
                    {employee.position?.title || "Unassigned"}
                  </p>
                  {employee.position?.jobLevel && (
                    <p className="text-xs text-gray-400 pl-5">Level: {employee.position.jobLevel}</p>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-3">
                  <p className="text-xs text-gray-500">Reporting Supervisor / Manager</p>
                  {employee.manager ? (
                    <div className="mt-1 flex items-center gap-2 rounded-lg bg-gray-50 p-2.5">
                      <Users className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-xs font-semibold text-gray-900">{employee.manager.name}</p>
                        <p className="text-[11px] text-gray-500 font-mono">{employee.manager.employeeId}</p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 pt-1">No direct reporting manager assigned.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Card: Linked Employee Devices */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="flex items-center gap-2 text-base font-bold text-gray-900 border-b border-gray-100 pb-3">
                <Laptop className="h-5 w-5 text-gray-700" /> Registered Devices
              </h2>
              <div className="pt-4">
                {!employee.employeeDevices || employee.employeeDevices.length === 0 ? (
                  <p className="text-xs text-gray-500">No device registered for attendance punch.</p>
                ) : (
                  <div className="space-y-3">
                    {employee.employeeDevices.map((dev) => (
                      <div key={dev.id} className="rounded-lg border border-gray-100 p-3 bg-gray-50/60">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-xs text-gray-900">
                            {dev.deviceName || "Desktop / Mobile Device"}
                          </p>
                          {dev.isApproved ? (
                            <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-semibold text-green-800">
                              Approved
                            </span>
                          ) : (
                            <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-[10px] font-semibold text-yellow-800">
                              Pending
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] font-mono text-gray-500 pt-1">ID: {dev.deviceId}</p>
                        {dev.operatingSystem && (
                          <p className="text-[11px] text-gray-500">OS: {dev.operatingSystem}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Modals */}
        <EmployeeModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={fetchEmployeeDetails}
          employee={employee}
        />

        <DeleteEmployeeModal
          isOpen={isDeleteModalOpen}
          employee={employee}
          onClose={() => setIsDeleteModalOpen(false)}
          onSuccess={() => router.push("/admin/users")}
        />
      </div>
    </DashboardLayout>
  );
}
