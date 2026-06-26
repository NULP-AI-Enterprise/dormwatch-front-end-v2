import { BellOff } from "lucide-react";

const CommunityBoard = () => {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-stone-50">Дошка оголошень</h2>
      </div>
      <div className="bg-stone-800/50 border border-stone-700 border-dashed p-8 flex flex-col items-center justify-center text-center h-[280px]">
        <div className="w-12 h-12 mb-4 border border-stone-600 bg-stone-800 flex items-center justify-center text-stone-400">
          <BellOff className="w-5 h-5" strokeWidth={1.5} />
        </div>
        <h3 className="text-stone-200 font-semibold mb-1">Немає оголошень</h3>
        <p className="text-xs text-stone-400 leading-relaxed max-w-[200px]">
          Ваша дошка порожня. Ми опублікуємо інформацію про планові ремонти або оновлення корпусу.
        </p>
      </div>
    </div>
  );
};

export default CommunityBoard;
