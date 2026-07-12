import { useEffect, useState, useCallback } from "react";
import { fetchBuildings, fetchResidents, relocateResident, fetchPlaces } from "../services/problemsApi";
import { Card, CardContent } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Button } from "../components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "../components/ui/radio-group";
import { Separator } from "../components/ui/separator";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SearchIcon,
  Cancel01Icon,
  UserIcon,
  Building03Icon,
  Home01Icon,
  Forward01Icon,
  AiPhone01Icon,
} from "@hugeicons/core-free-icons";
import LoadingSpinner from "../components/LoadingSpinner";

function FilterRadioGroup({
  options,
  value,
  onChange,
}: {
  options: { id: string; name: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <RadioGroup value={value} onValueChange={onChange} className="space-y-1">
      {options.map((opt) => (
        <label
          key={opt.id}
          className={`flex items-center gap-3 p-2.5 cursor-pointer transition-colors border-l-4 ${
            value === opt.id
              ? "border-l-blue-500 bg-primary/5 text-foreground"
              : "border-l-transparent text-muted-foreground hover:border-l-stone-500 hover:text-foreground"
          }`}
        >
          <RadioGroupItem value={opt.id} id={`filter-${opt.id}`} className="w-3.5 h-3.5 accent-blue-500" />
          <span className="text-xs font-semibold cursor-pointer">
            {opt.name}
          </span>
        </label>
      ))}
    </RadioGroup>
  );
}

export default function AdminResidentsPage() {
  const [loading, setLoading] = useState(true);
  const [residents, setResidents] = useState<any[]>([]);
  const [buildings, setBuildings] = useState<any[]>([]);
  const [err, setErr] = useState("");
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBuildingId, setSelectedBuildingId] = useState("all");
  const [selectedFloor, setSelectedFloor] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all"); // all, assigned, unassigned

  // Relocation states
  const [relocateTarget, setRelocateTarget] = useState<any | null>(null);
  const [relocateBuildingId, setRelocateBuildingId] = useState("");
  const [relocateRoomName, setRelocateRoomName] = useState("");
  const [relocating, setRelocating] = useState(false);
  const [relocateError, setRelocateError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const [relocateRooms, setRelocateRooms] = useState<any[]>([]);
  const [relocateRoomsLoading, setRelocateRoomsLoading] = useState(false);
  const [isRelocateConfirmOpen, setIsRelocateConfirmOpen] = useState(false);

  useEffect(() => {
    if (!relocateBuildingId) {
      setRelocateRooms([]);
      return;
    }
    setRelocateRoomsLoading(true);
    fetchPlaces(Number(relocateBuildingId))
      .then((data) => {
        setRelocateRooms(data || []);
      })
      .catch(() => {
        setRelocateRooms([]);
      })
      .finally(() => {
        setRelocateRoomsLoading(false);
      });
  }, [relocateBuildingId]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      const buildingsData = await fetchBuildings();
      setBuildings(buildingsData || []);
      
      // Fetch residents for selected building filter (handles 'all' and 'unassigned' specially)
      let fetchBuildingParam = "";
      if (selectedBuildingId === "unassigned") {
        fetchBuildingParam = "unassigned";
      } else if (selectedBuildingId !== "all") {
        fetchBuildingParam = selectedBuildingId;
      }
      
      const residentsData = await fetchResidents(fetchBuildingParam);
      setResidents(residentsData || []);
    } catch (err: any) {
      console.warn("Failed to load residents data", err);
      setErr("Не вдалося завантажити дані мешканців.");
    } finally {
      setLoading(false);
    }
  }, [selectedBuildingId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Open relocation modal
  const handleOpenRelocate = (resident: any) => {
    setRelocateTarget(resident);
    setRelocateBuildingId(resident.place?.building?.building_id ? String(resident.place.building.building_id) : "");
    setRelocateRoomName(resident.place?.place_name || "");
    setRelocateError("");
  };

  const triggerRelocateConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!relocateTarget) return;
    if (!relocateBuildingId) {
      setRelocateError("Оберіть гуртожиток.");
      return;
    }
    if (!relocateRoomName.trim()) {
      setRelocateError("Вкажіть номер або назву кімнати.");
      return;
    }
    setIsRelocateConfirmOpen(true);
  };

  // Handle relocation submit
  const handleRelocateSubmit = async () => {
    if (!relocateTarget) return;
    if (!relocateBuildingId) {
      setRelocateError("Оберіть гуртожиток.");
      return;
    }
    if (!relocateRoomName.trim()) {
      setRelocateError("Вкажіть номер або назву кімнати.");
      return;
    }

    setRelocating(true);
    setRelocateError("");
    try {
      await relocateResident(relocateTarget.user, relocateBuildingId, relocateRoomName.trim());
      const targetBName = buildings.find(b => String(b.building_id) === relocateBuildingId)?.name || "";
      setSuccessMessage(`Студента ${relocateTarget.first_name} ${relocateTarget.last_name} успішно переселено до корпусу ${targetBName}, кімната ${relocateRoomName.trim()}! 📦 Дані мешканця оновлено.`);
      setRelocateTarget(null);
      loadData();
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(""), 5000);
    } catch (err: any) {
      setRelocateError(err.message || "Не вдалося переселити мешканця.");
    } finally {
      setRelocating(false);
    }
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedBuildingId("all");
    setSelectedFloor("all");
    setSelectedStatus("all");
  };

  // Filter computation
  const filteredResidents = residents.filter((r) => {
    // 1. Search Query (First Name, Last Name, Email)
    const fullName = `${r.first_name || ""} ${r.last_name || ""}`.toLowerCase();
    const email = (r.email || "").toLowerCase();
    const query = searchQuery.toLowerCase();
    const matchesSearch = fullName.includes(query) || email.includes(query);

    // 2. Relocation Status Filter
    const hasDormitory = !!r.place?.building;
    const matchesStatus =
      selectedStatus === "all" ||
      (selectedStatus === "assigned" && hasDormitory) ||
      (selectedStatus === "unassigned" && !hasDormitory);

    // 3. Floor Filter (extracted from room name first character if numeric)
    let matchesFloor = true;
    if (selectedFloor !== "all") {
      const roomName = r.place?.place_name || "";
      const match = roomName.match(/^\d/); // first digit
      const floor = match ? match[0] : "";
      matchesFloor = floor === selectedFloor;
    }

    return matchesSearch && matchesStatus && matchesFloor;
  });

  const hasActiveFilters =
    searchQuery !== "" ||
    selectedBuildingId !== "all" ||
    selectedFloor !== "all" ||
    selectedStatus !== "all";

  const formatPhoneNumber = (phone: string | undefined | null) => {
    if (!phone) return "Не вказано";
    const digits = phone.replace(/\D/g, "");
    if (digits.length === 10) {
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
    }
    if (digits.length === 12 && digits.startsWith("38")) {
      const local = digits.slice(2);
      return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6, 8)} ${local.slice(8, 10)}`;
    }
    return phone;
  };

  return (
    <div className="container mx-auto px-6 py-8 relative">

      {successMessage && (
        <div className="mb-6 p-4 border border-green-500/20 bg-green-500/10 text-green-400 text-xs font-semibold rounded-lg shadow-sm flex justify-between items-center animate-fade-in">
          <span>{successMessage}</span>
          <button onClick={() => setSuccessMessage("")} className="text-green-500 hover:text-green-400 font-bold ml-2">×</button>
        </div>
      )}

      {err && (
        <div className="mb-6 p-4 border border-destructive/20 bg-destructive/10 text-destructive text-xs font-bold rounded-lg shadow-sm">
          {err}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left column: Filters */}
        <div className="lg:col-span-1 space-y-6">
          <Card className="border border-border/60 shadow-sm bg-card sticky top-24">
            <CardContent className="p-4 space-y-6">
              {/* Name search */}
              <div className="space-y-2">
                <div className="relative">
                  <HugeiconsIcon icon={SearchIcon} className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" strokeWidth={2} />
                  <Input
                    placeholder="Ім'я, прізвище або пошта..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 text-xs h-9"
                  />
                </div>
              </div>

              {/* Reset filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="w-full h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5 border border-dashed border-border hover:border-solid"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-3" />
                  Скинути всі фільтри
                </Button>
              )}

              {/* Building Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Гуртожиток
                </label>
                <FilterRadioGroup
                  options={[
                    { id: "all", name: "Всі гуртожитки" },
                    ...buildings.map((b) => ({ id: String(b.building_id), name: b.name })),
                    { id: "unassigned", name: "Без гуртожитку" },
                  ]}
                  value={selectedBuildingId}
                  onChange={setSelectedBuildingId}
                />
              </div>

              <Separator className="my-4" />

              {/* Floor Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Поверх кімнати
                </label>
                <FilterRadioGroup
                  options={[
                    { id: "all", name: "Будь-який поверх" },
                    { id: "1", name: "1 поверх" },
                    { id: "2", name: "2 поверх" },
                    { id: "3", name: "3 поверх" },
                    { id: "4", name: "4 поверх" },
                    { id: "5", name: "5 поверх" },
                    { id: "6", name: "6 поверх" },
                    { id: "7", name: "7 поверх" },
                    { id: "8", name: "8 поверх" },
                    { id: "9", name: "9 поверх" },
                  ]}
                  value={selectedFloor}
                  onChange={setSelectedFloor}
                />
              </div>

              <Separator className="my-4" />

              {/* Relocation / Status Select */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Статус розселення
                </label>
                <FilterRadioGroup
                  options={[
                    { id: "all", name: "Всі студенти" },
                    { id: "assigned", name: "Розселені в кімнати" },
                    { id: "unassigned", name: "Немає кімнати" },
                  ]}
                  value={selectedStatus}
                  onChange={setSelectedStatus}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Residents List */}
        <div className="lg:col-span-3">
          <Card className="border border-border/60 shadow-sm bg-card h-full">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
                Список студентів ({filteredResidents.length})
              </h3>
            </div>
            <CardContent className="p-0">
              {loading ? (
                <div className="py-20 flex justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              ) : filteredResidents.length === 0 ? (
                <div className="py-20 text-center text-muted-foreground">
                  <HugeiconsIcon icon={UserIcon} className="size-12 mx-auto mb-3 opacity-20" strokeWidth={1.5} />
                  <p className="text-sm font-semibold">Студентів не знайдено</p>
                  <p className="text-xs mt-1">Спробуйте змінити фільтри або запит пошуку.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/40 text-[10px] uppercase font-bold text-muted-foreground tracking-wider">
                        <th className="p-4">Студент</th>
                        <th className="p-4">Контакти</th>
                        <th className="p-4">Розміщення</th>
                        <th className="p-4 text-right">Дія</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60 text-xs">
                      {filteredResidents.map((r) => {
                        const hasDorm = !!r.place?.building;
                        return (
                          <tr key={r.user} className="hover:bg-muted/20 transition-colors">
                            <td className="p-4">
                              <div className="flex items-center gap-3">
                                <div className="size-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm shrink-0 border border-primary/20">
                                  {(r.first_name?.[0] || "").toUpperCase()}
                                </div>
                                <div>
                                  <p className="font-bold text-foreground">
                                    {r.first_name} {r.last_name}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5">{r.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="p-4 font-medium text-muted-foreground">
                              <div className="flex items-center gap-1.5">
                                <HugeiconsIcon icon={AiPhone01Icon} className="size-3.5 text-primary shrink-0" strokeWidth={2} />
                                <span>{formatPhoneNumber(r.contact_info)}</span>
                              </div>
                            </td>
                            <td className="p-4">
                              {hasDorm ? (
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-foreground font-bold">
                                    <HugeiconsIcon icon={Building03Icon} className="size-3.5 text-primary shrink-0" strokeWidth={1.5} />
                                    <span>{r.place.building.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1.5 text-muted-foreground text-[10px]">
                                    <HugeiconsIcon icon={Home01Icon} className="size-3.5 shrink-0" strokeWidth={2} />
                                    <span>Кімната {r.place.place_name}</span>
                                  </div>
                                </div>
                              ) : (
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/10 text-yellow-500 border border-yellow-500/20">
                                  Не призначено
                                </span>
                              )}
                            </td>
                            <td className="p-4 text-right">
                              <Button
                                variant="outline"
                                size="xs"
                                onClick={() => handleOpenRelocate(r)}
                                className="inline-flex items-center gap-1 text-[11px] h-7 border-blue-500/20 text-blue-400 hover:bg-blue-500/10 hover:border-blue-500 hover:text-blue-400 font-semibold"
                              >
                                <HugeiconsIcon icon={Forward01Icon} className="size-3" strokeWidth={2.5} />
                                Переселити
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Relocation Dialog Modal */}
      {relocateTarget && (
        <Dialog open={!!relocateTarget} onOpenChange={(open) => !open && setRelocateTarget(null)}>
          <DialogContent className="max-w-md bg-background border-border">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-foreground">
                🏠 Переселення мешканця
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Вкажіть новий гуртожиток та кімнату для {relocateTarget.first_name} {relocateTarget.last_name}.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={triggerRelocateConfirm} className="space-y-4 pt-2">
              {relocateError && (
                <div className="p-3 border border-destructive/20 bg-destructive/10 text-destructive text-xs font-semibold rounded-lg">
                  {relocateError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Гуртожиток
                </label>
                <select
                  value={relocateBuildingId}
                  onChange={(e) => setRelocateBuildingId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  required
                >
                  <option value="">Оберіть гуртожиток...</option>
                  {buildings.map((b) => (
                    <option key={b.building_id} value={b.building_id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                  Кімната
                </label>
                <select
                  value={relocateRoomName}
                  onChange={(e) => setRelocateRoomName(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={relocateRoomsLoading || relocateRooms.length === 0}
                  required
                >
                  {relocateRoomsLoading ? (
                    <option value="">Завантаження кімнат...</option>
                  ) : relocateRooms.length === 0 ? (
                    <option value="">Немає доступних кімнат у цьому корпусі</option>
                  ) : (
                    <>
                      <option value="">Оберіть кімнату...</option>
                      {relocateRooms.map((room) => (
                        <option key={room.place_id} value={room.place_name}>
                          {room.place_name}
                        </option>
                      ))}
                    </>
                  )}
                </select>
              </div>

              <DialogFooter className="pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setRelocateTarget(null)}
                  className="h-9 text-xs"
                  disabled={relocating}
                >
                  Скасувати
                </Button>
                <Button
                  type="submit"
                  className="h-9 text-xs font-semibold"
                  disabled={relocating || !relocateBuildingId || !relocateRoomName}
                >
                  {relocating ? "Збереження..." : "Підтвердити перенесення"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      )}

      <AlertDialog open={isRelocateConfirmOpen} onOpenChange={setIsRelocateConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Переселити студента?</AlertDialogTitle>
            <AlertDialogDescription>
              Ви дійсно хочете переселити цього студента в інший гуртожиток / кімнату?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsRelocateConfirmOpen(false)}>Скасувати</AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              setIsRelocateConfirmOpen(false);
              setRelocateTarget(null); // Close parent relocation dialog
              handleRelocateSubmit();
            }}>
              Підтвердити
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
