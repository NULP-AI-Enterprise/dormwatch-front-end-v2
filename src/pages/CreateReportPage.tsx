import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createProblem, fetchUserProfile, fetchPlaces } from "../services/problemsApi";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft01Icon, Camera01Icon, DropletsIcon, BoltIcon, ArmchairIcon, WifiIcon, Cancel01Icon, Forward01Icon } from "@hugeicons/core-free-icons";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogClose } from "../components/ui/dialog";

const categories = [
  {
    id: "plumbing",
    label: "Сантехніка",
    Icon: DropletsIcon,
    activeClass: "bg-blue-500/10 border-2 border-blue-500 text-blue-500 hover:bg-blue-500/15",
    inactiveClass: "bg-card border border-border text-muted-foreground hover:border-blue-500/30 hover:bg-blue-500/5 hover:text-blue-400",
    iconClass: "text-blue-500"
  },
  {
    id: "electricity",
    label: "Електрика",
    Icon: BoltIcon,
    activeClass: "bg-yellow-500/10 border-2 border-yellow-500 text-yellow-500 hover:bg-yellow-500/15",
    inactiveClass: "bg-card border border-border text-muted-foreground hover:border-yellow-500/30 hover:bg-yellow-500/5 hover:text-yellow-500",
    iconClass: "text-yellow-500"
  },
  {
    id: "furniture",
    label: "Меблі",
    Icon: ArmchairIcon,
    activeClass: "bg-orange-500/10 border-2 border-orange-500 text-orange-500 hover:bg-orange-500/15",
    inactiveClass: "bg-card border border-border text-muted-foreground hover:border-orange-500/30 hover:bg-orange-500/5 hover:text-orange-500",
    iconClass: "text-orange-600"
  },
  {
    id: "internet",
    label: "Інтернет",
    Icon: WifiIcon,
    activeClass: "bg-indigo-500/10 border-2 border-indigo-500 text-indigo-500 hover:bg-indigo-500/15",
    inactiveClass: "bg-card border border-border text-muted-foreground hover:border-indigo-500/30 hover:bg-indigo-500/5 hover:text-indigo-500",
    iconClass: "text-indigo-500"
  },
];

const CreateReportPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state || {};
  const [selectedCategory, setSelectedCategory] = useState(state.category || "plumbing");
  const [formData, setFormData] = useState({
    title: state.title || "",
    description: state.description || "",
    priority: state.priority || "low",
    placeName: "",
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  const [userBuildingId, setUserBuildingId] = useState<number | null>(null);
  const [rooms, setRooms] = useState<Array<{place_id: number, place_name: string}>>([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [isCustomPlace, setIsCustomPlace] = useState(false);
  const [customPlaceName, setCustomPlaceName] = useState("");

  useEffect(() => {
    fetchUserProfile().then((user) => {
      if (user?.place?.building?.building_id) {
        setUserBuildingId(user.place.building.building_id);
      }
      if (user?.place?.place_name) {
        setFormData((prev) => ({ ...prev, placeName: user.place.place_name }));
        setCustomPlaceName(user.place.place_name);
      }
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!userBuildingId) return;
    setRoomsLoading(true);
    fetchPlaces(userBuildingId)
      .then((data) => {
        const roomsList = data || [];
        setRooms(roomsList);
        // If the user has an assigned room that is not in the rooms list, activate custom text entry mode
        if (formData.placeName && !roomsList.some((r: any) => r.place_name === formData.placeName)) {
          setIsCustomPlace(true);
        }
      })
      .catch(() => {
        setRooms([]);
        setIsCustomPlace(true);
      })
      .finally(() => {
        setRoomsLoading(false);
      });
  }, [userBuildingId]);

  const handlePlaceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === "custom") {
      setIsCustomPlace(true);
      setFormData((prev) => ({ ...prev, placeName: "" }));
    } else {
      setIsCustomPlace(false);
      setFormData((prev) => ({ ...prev, placeName: val }));
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleRemovePhoto = () => {
    setPhotoFile(null);
    setPreviewUrl(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Вкажи короткий заголовок проблеми.");
      return;
    }
    if (!formData.description.trim()) {
      setError("Опиши проблему.");
      return;
    }

    setSubmitting(true);
    try {
      await createProblem({
        category: selectedCategory,
        title: formData.title.trim(),
        description: formData.description.trim(),
        priority: formData.priority,
        place_name: (isCustomPlace ? customPlaceName.trim() : formData.placeName.trim()) || undefined,
        photoFile: photoFile,
      });
      sessionStorage.setItem("studentReportSuccess", "Заявку успішно створено! 🛠️ Наш комендант та майстри вже працюють над нею.");
      navigate("/user");
    } catch (err: any) {
      setError(`Не вдалось створити заявку: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-6 py-12 relative">
      {/* Decorative gradient background element */}
      <div className="absolute top-10 right-10 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-green-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="flex items-center gap-4 mb-10 relative z-10">
        <Link
          to="/home"
          className="p-2 border border-blue-500/20 text-blue-400 hover:border-blue-500 hover:bg-blue-500/10 transition-colors bg-blue-500/5 rounded-lg flex items-center justify-center shadow-sm"
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} className="size-5" strokeWidth={2.5} />
        </Link>
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
            Нове звернення
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Повідомте про проблему, і ми вирішимо її найближчим часом!</p>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 border border-destructive/20 bg-destructive/10 text-destructive text-xs font-bold rounded-lg shadow-sm animate-shake">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8 bg-card border border-border p-6 md:p-8 rounded-xl shadow-sm relative z-10">
        <div>
          <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-4">
            🛠️ Що саме трапилось?
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => {
              const isActive = selectedCategory === category.id;
              return (
                <Button
                  key={category.id}
                  type="button"
                  onClick={() => setSelectedCategory(category.id)}
                  className={`p-5 h-auto flex flex-col items-center gap-3 transition-all duration-200 active:scale-95 hover:scale-[1.02] shadow-sm rounded-xl ${
                    isActive ? category.activeClass : category.inactiveClass
                  }`}
                >
                  <HugeiconsIcon
                    icon={category.Icon}
                    className={`size-7 transition-transform group-hover:scale-110 ${
                      isActive ? category.iconClass : "text-muted-foreground"
                    }`}
                    strokeWidth={2}
                  />
                  <span className="text-xs font-bold">
                    {category.label}
                  </span>
                </Button>
              );
            })}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-5">
            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-3">
                ⚠️ Рівень пріоритету
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "low", label: "Низький", activeClass: "bg-green-500/10 text-green-500 border-green-500 hover:bg-green-500/15" },
                  { id: "medium", label: "Середній", activeClass: "bg-yellow-500/10 text-yellow-500 border-yellow-500 hover:bg-yellow-500/15" },
                  { id: "high", label: "Високий", activeClass: "bg-orange-500/10 text-orange-500 border-orange-500 hover:bg-orange-500/15" },
                  { id: "critical", label: "Критичний", activeClass: "bg-red-500/20 text-red-500 border-red-500/80 font-bold hover:bg-red-500/30 animate-pulse" },
                ].map((p) => {
                  const isActive = formData.priority === p.id;
                  return (
                    <Button
                      key={p.id}
                      type="button"
                      onClick={() =>
                        setFormData((prev) => ({ ...prev, priority: p.id }))
                      }
                      className={`py-2 px-3 text-xs font-bold transition-all duration-150 rounded-lg active:scale-95 border-2 ${
                        isActive
                          ? p.activeClass
                          : "bg-card border-border text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                      }`}
                    >
                      {p.label}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-2">
                📝 Короткий заголовок
              </label>
              <Input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Наприклад: Зламався змішувач, протікає батарея..."
                maxLength={80}
                required
                className="h-10 rounded-lg"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-2">
                📍 Де саме проблема?
              </label>
              {!isCustomPlace ? (
                <select
                  name="placeName"
                  value={formData.placeName}
                  onChange={handlePlaceChange}
                  className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-xs ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  disabled={roomsLoading}
                >
                  {roomsLoading ? (
                    <option value="">Завантаження кімнат...</option>
                  ) : (
                    <>
                      <option value="">Оберіть кімнату...</option>
                      {rooms.map((room) => (
                        <option key={room.place_id} value={room.place_name}>
                          {room.place_name}
                        </option>
                      ))}
                      <option value="custom">Інше (ввести вручну)</option>
                    </>
                  )}
                </select>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <Input
                      type="text"
                      placeholder="Наприклад: 105, 312а або Кухня 1 поверху..."
                      value={customPlaceName}
                      onChange={(e) => setCustomPlaceName(e.target.value)}
                      className="h-10 rounded-lg flex-1 text-xs"
                      required
                    />
                    {rooms.length > 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCustomPlace(false);
                          setCustomPlaceName("");
                          setFormData((prev) => ({ ...prev, placeName: rooms[0]?.place_name || "" }));
                        }}
                        className="h-10 text-xs px-3 shrink-0"
                      >
                        Назад до списку
                      </Button>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Введіть номер кімнати або назву локації вручну.
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-2">
                💬 Детальний опис проблеми
              </label>
              <Textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={5}
                placeholder="Будь ласка, вкажіть деталі: що сталось, коли помітили, чи потрібна присутність у кімнаті..."
                className="min-h-32 resize-none rounded-lg"
                required
              />
            </div>
          </div>

          <div className="flex flex-col">
            <label className="text-xs font-bold text-foreground uppercase tracking-wider block mb-3">
              📸 Фотодоказ (прискорює ремонт)
            </label>
            {photoFile && previewUrl ? (
              <div className="relative w-full aspect-[3/2] md:aspect-square border-2 border-border overflow-hidden rounded-xl group shadow-sm flex-1 min-h-[200px]">
                <img
                  src={previewUrl}
                  alt="Preview"
                  onClick={() => setIsPreviewOpen(true)}
                  className="w-full h-full object-cover cursor-zoom-in"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  onClick={handleRemovePhoto}
                  className="absolute top-3 right-3 bg-card/85 border border-border text-destructive hover:bg-card hover:scale-105 transition-all shadow-md"
                >
                  <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2.5} />
                </Button>
              </div>
            ) : (
              <label className="w-full aspect-[3/2] md:aspect-square border-2 border-dashed border-border flex flex-col items-center justify-center p-6 text-center cursor-pointer hover:border-blue-500/55 hover:bg-blue-500/5 transition-all duration-200 rounded-xl shadow-sm flex-1 min-h-[200px] group">
                <HugeiconsIcon
                  icon={Camera01Icon}
                  className="size-10 mb-3 text-muted-foreground group-hover:scale-110 group-hover:text-blue-400 transition-all duration-200"
                  strokeWidth={2}
                />
                <p className="text-xs font-bold text-foreground mb-1">
                  Натисніть для завантаження фото
                </p>
                <p className="text-[10px] text-muted-foreground max-w-xs leading-normal">
                  Підтримуються формати PNG, JPEG (до 10 МБ)
                </p>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg, image/webp"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </label>
            )}
          </div>
        </div>

        <Button
          type="submit"
          size="lg"
          disabled={submitting}
          className="w-full h-12 text-sm font-bold shadow-md rounded-xl bg-blue-500 hover:bg-blue-600 transition-all active:scale-[0.99] flex items-center justify-center gap-2"
        >
          <HugeiconsIcon icon={Forward01Icon} className="size-5" strokeWidth={2.5} />
          {submitting ? "Надсилаю заявку..." : "Опублікувати звернення"}
        </Button>
      </form>

      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-[90vw] sm:max-w-[90vw] bg-transparent border-none shadow-none p-0 flex justify-center items-center" showCloseButton={false}>
          <DialogTitle className="sr-only">Image preview</DialogTitle>
          {previewUrl && (
            <img
              src={previewUrl}
              className="w-full h-auto max-h-[90vh] object-contain rounded-xl"
              alt="Full size preview"
            />
          )}
          <DialogClose className="absolute top-4 right-4 text-foreground hover:text-stone-300">
            <HugeiconsIcon icon={Cancel01Icon} className="size-6" strokeWidth={2} />
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CreateReportPage;
