"use client";

import { useEffect, useState } from "react";
import { ProtectedRoute } from "@/components/auth/protected-route";
import { MobileLayout } from "@/components/layout/mobile-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiRequest } from "@/lib/api";
import { Document } from "@/types/document";
import { AssetAssignment } from "@/types/asset";
import { Laptop, FolderKanban, Building2, ExternalLink, Loader2 } from "lucide-react";

export default function MobileVaultPage() {
  const [assets, setAssets] = useState<AssetAssignment[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [policies, setPolicies] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ASSETS" | "DOCS" | "POLICIES">("ASSETS");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [assetRes, docRes, polRes] = await Promise.all([
        apiRequest<AssetAssignment[]>("/assets/my-assets"),
        apiRequest<Document[]>("/documents/my-documents"),
        apiRequest<Document[]>("/documents/policies"),
      ]);
      setAssets(assetRes);
      setDocuments(docRes);
      setPolicies(polRes);
    } catch (err) {
      console.error("Failed to load mobile vault data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return (
    <ProtectedRoute requiredRole="EMPLOYEE">
      <MobileLayout>
        <div className="space-y-4">
          <div>
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-1.5">
              <FolderKanban className="h-5 w-5 text-emerald-600" /> Vault & Inventory
            </h2>
            <p className="text-xs text-gray-500">Hardware assets, personal files & company rules</p>
          </div>

          {/* Sub Tab Switcher */}
          <div className="grid grid-cols-3 gap-1 bg-gray-200 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setTab("ASSETS")}
              className={`py-1.5 rounded-lg transition-all ${tab === "ASSETS" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-600"}`}
            >
              Assets ({assets.length})
            </button>
            <button
              onClick={() => setTab("DOCS")}
              className={`py-1.5 rounded-lg transition-all ${tab === "DOCS" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-600"}`}
            >
              My Docs ({documents.length})
            </button>
            <button
              onClick={() => setTab("POLICIES")}
              className={`py-1.5 rounded-lg transition-all ${tab === "POLICIES" ? "bg-white text-emerald-700 shadow-xs" : "text-gray-600"}`}
            >
              Policies ({policies.length})
            </button>
          </div>

          {/* Tab 1: Hardware Assets */}
          {tab === "ASSETS" && (
            <div>
              {loading ? (
                <div className="flex h-32 items-center justify-center bg-white rounded-2xl">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                </div>
              ) : assets.length ? (
                <div className="space-y-2.5">
                  {assets.map((item) => (
                    <Card key={item.id} className="border-0 shadow-sm bg-white rounded-2xl">
                      <CardContent className="p-3.5 space-y-1.5 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900">{item.asset?.name || "Assigned Equipment"}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{item.asset?.assetTag || "AST-000"}</p>
                          </div>
                          <Badge className="bg-emerald-100 text-emerald-800 text-[10px]">
                            {item.asset?.condition || item.conditionOnAssign || "GOOD"}
                          </Badge>
                        </div>
                        <p className="text-[10px] text-gray-500">S/N: {item.asset?.serialNumber || "N/A"}</p>
                        <p className="text-[10px] text-gray-400">Assigned: {new Date(item.assignedDate).toLocaleDateString()}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-sm bg-white rounded-2xl">
                  <CardContent className="py-8 text-center text-xs text-gray-500">
                    No hardware assets assigned to your profile.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tab 2: Personal Documents */}
          {tab === "DOCS" && (
            <div>
              {loading ? (
                <div className="flex h-32 items-center justify-center bg-white rounded-2xl">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                </div>
              ) : documents.length ? (
                <div className="space-y-2.5">
                  {documents.map((doc) => (
                    <Card key={doc.id} className="border-0 shadow-sm bg-white rounded-2xl">
                      <CardContent className="p-3.5 space-y-1.5 text-xs">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-gray-900">{doc.title}</p>
                            <p className="text-[10px] text-gray-500 font-mono">{doc.documentNo}</p>
                          </div>
                          <Badge className={
                            doc.status === "ACTIVE" ? "bg-emerald-100 text-emerald-800" :
                            doc.status === "EXPIRING_SOON" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
                          }>
                            {doc.status.replace("_", " ")}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t text-[10px]">
                          <span className="text-gray-500">Expiry: {doc.expiryDate ? new Date(doc.expiryDate).toLocaleDateString() : "No Expiry"}</span>
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold flex items-center gap-0.5">
                            <ExternalLink className="h-3 w-3" /> View File
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-sm bg-white rounded-2xl">
                  <CardContent className="py-8 text-center text-xs text-gray-500">
                    No personal vault documents found.
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {/* Tab 3: Company Policies */}
          {tab === "POLICIES" && (
            <div>
              {loading ? (
                <div className="flex h-32 items-center justify-center bg-white rounded-2xl">
                  <Loader2 className="h-5 w-5 animate-spin text-emerald-600" />
                </div>
              ) : policies.length ? (
                <div className="space-y-2.5">
                  {policies.map((pol) => (
                    <Card key={pol.id} className="border-0 shadow-sm bg-white rounded-2xl">
                      <CardContent className="p-3.5 space-y-1.5 text-xs">
                        <p className="font-bold text-gray-900">{pol.title}</p>
                        {pol.notes && <p className="text-[10px] text-gray-600">{pol.notes}</p>}
                        <div className="flex justify-end pt-1 border-t text-[10px]">
                          <a href={pol.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-bold flex items-center gap-0.5">
                            <ExternalLink className="h-3 w-3" /> Read Handbook
                          </a>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="border-0 shadow-sm bg-white rounded-2xl">
                  <CardContent className="py-8 text-center text-xs text-gray-500">
                    No company policy handbooks published yet.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </MobileLayout>
    </ProtectedRoute>
  );
}
