"use client";

import { useState, useEffect } from "react";
import { Employee, CreateEmployeeInput } from "@/types/employee";
import { DepartmentTreeItem } from "@/types/department";
import { Position } from "@/types/position";
import { apiRequest } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface EmployeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  employee?: Employee | null;
}

const EMPLOYMENT_TYPES = [
  { value: "FULL_TIME", label: "Full Time" },
  { value: "PART_TIME", label: "Part Time" },
  { value: "CONTRACT", label: "Contract" },
  { value: "INTERN", label: "Intern" },
  { value: "TEMPORARY", label: "Temporary" },
];

const EMPLOYMENT_STATUSES = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "ON_LEAVE", label: "On Leave" },
  { value: "TERMINATED", label: "Terminated" },
  { value: "PROBATION", label: "Probation" },
];

export function EmployeeModal({
  isOpen,
  onClose,
  onSuccess,
  employee,
}: EmployeeModalProps) {
  const isEditing = !!employee;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [departments, setDepartments] = useState<DepartmentTreeItem[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [potentialManagers, setPotentialManagers] = useState<Employee[]>([]);

  const [formData, setFormData] = useState<CreateEmployeeInput>({
    email: "",
    password: "",
    name: "",
    firstName: "",
    middleName: "",
    lastName: "",
    employeeId: "",
    gender: null,
    dateOfBirth: "",
    address: "",
    avatarUrl: "",
    departmentId: "",
    positionId: "",
    managerId: "",
    phone: "",
    hireDate: "",
    employmentType: "FULL_TIME",
    employmentStatus: "ACTIVE",
    salary: undefined,
    role: "EMPLOYEE",
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      fetchOptions();
      if (employee) {
        setFormData({
          email: employee.email || "",
          password: "",
          name: employee.name || "",
          firstName: employee.firstName || "",
          middleName: employee.middleName || "",
          lastName: employee.lastName || "",
          employeeId: employee.employeeId || "",
          gender: employee.gender || null,
          dateOfBirth: employee.dateOfBirth ? employee.dateOfBirth.split("T")[0] : "",
          address: employee.address || "",
          avatarUrl: employee.avatarUrl || "",
          departmentId: employee.departmentId || "",
          positionId: employee.positionId || "",
          managerId: employee.managerId || "",
          phone: employee.phone || "",
          hireDate: employee.hireDate ? employee.hireDate.split("T")[0] : "",
          employmentType: employee.employmentType || "FULL_TIME",
          employmentStatus: employee.employmentStatus || "ACTIVE",
          salary: employee.salary ?? undefined,
          role: employee.role || "EMPLOYEE",
          isActive: employee.isActive ?? true,
        });
      } else {
        setFormData({
          email: "",
          password: "",
          name: "",
          firstName: "",
          middleName: "",
          lastName: "",
          employeeId: "",
          gender: null,
          dateOfBirth: "",
          address: "",
          avatarUrl: "",
          departmentId: "",
          positionId: "",
          managerId: "",
          phone: "",
          hireDate: new Date().toISOString().split("T")[0],
          employmentType: "FULL_TIME",
          employmentStatus: "ACTIVE",
          salary: undefined,
          role: "EMPLOYEE",
          isActive: true,
        });
      }
      setError(null);
    }
  }, [isOpen, employee]);

  const fetchOptions = async () => {
    try {
      const [deptsRes, posRes, empsRes] = await Promise.all([
        apiRequest<DepartmentTreeItem[]>("/departments/tree").catch(() => []),
        apiRequest<{ positions: Position[] }>("/positions?limit=100").catch(() => ({ positions: [] })),
        apiRequest<{ employees: Employee[] }>("/employees?limit=100&isActive=true").catch(() => ({ employees: [] })),
      ]);
      setDepartments((deptsRes || []).filter((d: any) => d.isActive !== false));
      setPositions((posRes.positions || []).filter((p: any) => p.isActive !== false));
      setPotentialManagers((empsRes.employees || []).filter((e: any) => !employee || e.id !== employee.id));
    } catch {
      // Ignore
    }
  };

  const filteredPositions = formData.departmentId
    ? positions.filter((p) => p.departmentId === formData.departmentId)
    : positions;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!isEditing && !formData.password) {
        throw new Error("Password is required for new employee");
      }

      if (!formData.firstName?.trim() && !formData.name?.trim()) {
        throw new Error("First name is required");
      }

      const computedName =
        [formData.firstName, formData.middleName, formData.lastName].filter(Boolean).join(" ").trim() ||
        formData.name?.trim() ||
        "";

      const payload: any = {
        email: formData.email.trim().toLowerCase(),
        name: computedName,
        firstName: formData.firstName?.trim() || null,
        middleName: formData.middleName?.trim() || null,
        lastName: formData.lastName?.trim() || null,
        employeeId: formData.employeeId.trim(),
        gender: formData.gender || null,
        dateOfBirth: formData.dateOfBirth || null,
        address: formData.address?.trim() || null,
        avatarUrl: formData.avatarUrl?.trim() || null,
        departmentId: formData.departmentId || null,
        positionId: formData.positionId || null,
        managerId: formData.managerId || null,
        phone: formData.phone?.trim() || null,
        hireDate: formData.hireDate || null,
        employmentType: formData.employmentType || "FULL_TIME",
        employmentStatus: formData.employmentStatus || "ACTIVE",
        salary: formData.salary !== undefined && formData.salary !== null && !isNaN(Number(formData.salary)) ? Number(formData.salary) : null,
        role: formData.role || "EMPLOYEE",
        isActive: formData.isActive ?? true,
      };

      if (formData.password) {
        payload.password = formData.password;
      }

      if (isEditing && employee) {
        await apiRequest(`/employees/${employee.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        toast({
          title: "Employee updated",
          description: `Employee "${computedName}" (${payload.employeeId}) was updated successfully.`,
          variant: "success",
        });
      } else {
        await apiRequest("/employees", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        toast({
          title: "Employee created",
          description: `Employee "${computedName}" (${payload.employeeId}) was onboarded successfully.`,
          variant: "success",
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to save employee");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b border-gray-100 pb-4">
          <h2 className="text-lg font-bold text-gray-900">
            {isEditing ? "Edit Employee Profile" : "Onboard New Employee"}
          </h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-md bg-red-50 p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {/* Section: Basic Identity */}
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Personal Profile
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="firstName">
                  First Name <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="firstName"
                  placeholder="e.g. John"
                  value={formData.firstName || ""}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  placeholder="e.g. Robert"
                  value={formData.middleName || ""}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="e.g. Smith"
                  value={formData.lastName || ""}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="employeeId">
                  Employee Code / ID <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="employeeId"
                  placeholder="e.g. EMP003"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={formData.gender || ""}
                  onChange={(e) => setFormData({ ...formData, gender: (e.target.value as any) || null })}
                  disabled={loading}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="email">
                  Email Address <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="e.g. john.smith@company.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  placeholder="+251 91 234 5678"
                  value={formData.phone || ""}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  disabled={loading}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address">Residential Address</Label>
              <Input
                id="address"
                placeholder="e.g. Bole Subcity, Woreda 03, House #123, Addis Ababa"
                value={formData.address || ""}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                disabled={loading}
              />
            </div>
          </div>

          {/* Section: Organization & Reporting */}
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Organization & Reporting
            </h3>

            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="departmentId">Department</Label>
                <select
                  id="departmentId"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={formData.departmentId || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, departmentId: e.target.value, positionId: "" })
                  }
                  disabled={loading}
                >
                  <option value="">Select Department</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="positionId">Position</Label>
                <select
                  id="positionId"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={formData.positionId || ""}
                  onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                  disabled={loading}
                >
                  <option value="">
                    {formData.departmentId ? "Select Department Position" : "Select Position"}
                  </option>
                  {filteredPositions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title} ({p.code})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="managerId">Reporting Manager</Label>
                <select
                  id="managerId"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={formData.managerId || ""}
                  onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                  disabled={loading}
                >
                  <option value="">No Manager (Top Level)</option>
                  {potentialManagers.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.employeeId})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Employment Details */}
          <div className="rounded-lg border border-gray-100 bg-gray-50/50 p-4 space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
              Employment Details & Security
            </h3>

            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="hireDate">Hire Date</Label>
                <Input
                  id="hireDate"
                  type="date"
                  value={formData.hireDate || ""}
                  onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employmentType">Employment Type</Label>
                <select
                  id="employmentType"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={formData.employmentType || "FULL_TIME"}
                  onChange={(e) => setFormData({ ...formData, employmentType: e.target.value })}
                  disabled={loading}
                >
                  {EMPLOYMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="employmentStatus">Employment Status</Label>
                <select
                  id="employmentStatus"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={formData.employmentStatus || "ACTIVE"}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      employmentStatus: e.target.value as any,
                      isActive: e.target.value === "ACTIVE" || e.target.value === "PROBATION",
                    })
                  }
                  disabled={loading}
                >
                  {EMPLOYMENT_STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="salary">Basic Monthly Salary ($)</Label>
                <Input
                  id="salary"
                  type="number"
                  step="0.01"
                  placeholder="e.g. 25000"
                  value={formData.salary ?? ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      salary: e.target.value !== "" ? parseFloat(e.target.value) : undefined,
                    })
                  }
                  disabled={loading}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="space-y-1.5">
                <Label htmlFor="password">
                  {isEditing ? "Password (leave empty to keep current)" : "Password *"}
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder={isEditing ? "••••••••" : "Min 6 characters"}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required={!isEditing}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role">System Access Role</Label>
                <select
                  id="role"
                  className="w-full rounded-md border border-gray-300 p-2 text-sm focus:border-blue-500 focus:outline-none"
                  value={formData.role || "EMPLOYEE"}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  disabled={loading}
                >
                  <option value="EMPLOYEE">Standard Employee</option>
                  <option value="ADMIN">System Administrator</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                disabled={loading}
              />
              <Label htmlFor="isActive" className="cursor-pointer text-xs font-medium text-gray-700">
                Account Enabled (User can authenticate and punch attendance)
              </Label>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : isEditing ? "Update Profile" : "Onboard Employee"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
