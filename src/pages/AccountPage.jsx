import { useEffect, useState } from "react";
import { 
  fetchUserProfile, 
  loginUser, 
  logoutUser
} from "../services/problemsApi";
import UserPage from "./UserPage";
import Preloader from "../components/Preloader";

const SERVER_URL = "http://127.0.0.1:8000";

const AccountPage = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);


  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const data = await fetchUserProfile();
      setUser(data);


    } catch (e) {
      console.log("Not logged in");
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    try {
      await loginUser(username, password);
      await loadProfile();
      setUsername("");
      setPassword("");
    } catch (err) {
      setLoginError("Невірний логін або пароль");
    }
  };



  if (loading) return <Preloader />;

  // --- ЛОГІН ---
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-slate-50">
        <div className="w-full max-w-md bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black text-slate-900">Вхід</h2>
            <p className="text-slate-500 text-sm mt-2">Увійдіть, щоб керувати профілем</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            {loginError && <div className="p-4 bg-red-50 text-red-600 rounded-xl text-center">{loginError}</div>}
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Логін</label>
                <input value={username} onChange={(e) => setUsername(e.target.value)} className="w-full p-4 border rounded-xl" />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Пароль</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full p-4 border rounded-xl" />
            </div>
            <button type="submit" className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700">Увійти</button>
          </form>
        </div>
      </div>
    );
  }


  const placeObj = user.place;
  const buildingObj = placeObj?.building;

  const roomInfo = placeObj ? `${placeObj.place_name}` : "Кімната не вказана";
  const buildingInfo = buildingObj ? `№${buildingObj.name || buildingObj.number || '?'}` : "Не вказано";

  const avatarUrl = user.photo_url 
    ? (user.photo_url.startsWith("http") ? user.photo_url : `${SERVER_URL}${user.photo_url.startsWith('/api') ? '' : '/api'}${user.photo_url}`) 
    : `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.first_name}`;

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
      <div className="grid lg:grid-cols-3 gap-6 sm:gap-8">
        
        <div className="lg:col-span-1 space-y-4 sm:space-y-6">
          <div className="bg-white rounded-2xl sm:rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                <div className="h-24 sm:h-32 bg-gradient-to-r from-indigo-600 to-purple-600 relative">
                  <div className="absolute -bottom-10 left-8">
                    <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl bg-white p-1.5 shadow-lg">
                      <img src={avatarUrl} className="w-full h-full rounded-2xl bg-slate-100 object-cover" alt="User Avatar" />
                    </div>
                  </div>
                </div>
                <div className="pt-14 pb-8 px-6 sm:px-8 mt-2">
                  <h2 className="text-2xl font-black text-slate-900">{user.first_name} {user.last_name}</h2>
                  <p className="text-sm font-medium text-slate-500 mb-6 flex flex-col gap-1">
                    <span className="italic">{user.email}</span>
                    {user.is_admin && <span className="text-indigo-600 font-bold text-xs uppercase bg-indigo-50 px-2 py-1 rounded w-fit">Адміністратор</span>}
                  </p>
                  <div className="space-y-4 mb-8">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl">🏢</div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Гуртожиток</p>
                        <p className="text-sm font-bold text-slate-700">{buildingInfo}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-xl">🚪</div>
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Розміщення</p>
                        <p className="text-sm font-bold text-slate-700">{roomInfo}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={logoutUser} className="w-full py-3 bg-red-50 text-red-600 rounded-xl text-xs font-bold hover:bg-red-100 border border-red-100">Вийти з акаунта</button>
                  </div>
                </div>
          </div>
          
          <div className="bg-white rounded-2xl sm:rounded-[2rem] p-6 border border-slate-100 shadow-sm">
             <h4 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              Контакти допомоги
            </h4>
            <div className="p-3 bg-slate-50 rounded-xl">
               <p className="text-[10px] font-bold text-slate-400 uppercase">Комендант</p>
               <p className="text-sm font-bold text-slate-900">093 123 45 67</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <UserPage />
        </div>
      </div>
    </main>
  );
};

export default AccountPage;