import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'

const REQUEST_TYPE_LABELS = {
  prescription: 'روشتة',
  convoy: 'قافلة',
  medical: 'أجهزة طبية',
  consultation: 'استشارة',
}

const STATUS_LABELS = {
  pending: { text: 'قيد الانتظار', className: 'bg-yellow-100 text-yellow-800' },
  approved: { text: 'مقبول', className: 'bg-green-100 text-green-800' },
  rejected: { text: 'مرفوض', className: 'bg-red-100 text-red-800' },
}

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [user, setUser] = useState(null)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [requests, setRequests] = useState([])

  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      setUser(data.session?.user || null)
      if (data.session?.user) fetchRequests()
    }
    checkSession()
  }, [])

  async function fetchRequests() {
    setLoading(true)
    const { data, error } = await supabase
      .from('requests')
      .select('*')
      .order('created_at', { ascending: false })
    if (!error) setRequests(data || [])
    setLoading(false)
  }

  async function updateStatus(id, newStatus) {
    const { error } = await supabase.from('requests').update({ status: newStatus }).eq('id', id)
    if (!error) fetchRequests()
  }

  const getImageUrl = (path) => {
    if (!path) return null
    const { data } = supabase.storage.from('prescriptions').getPublicUrl(path)
    return data.publicUrl
  }

  const exportToCSV = () => {
    const headers = ["الاسم", "الهاتف", "نوع الطلب", "السن", "المدينة", "الجهاز", "الأمراض المزمنة", "الأعراض", "التفاصيل", "الحالة", "رابط الروشتة"];
    const rows = requests.map(req => {
      const imgUrl = req.image_url ? getImageUrl(req.image_url) : "";
      return [
        `"${req.full_name || ""}"`,
        `"${req.phone || ""}"`,
        `"${REQUEST_TYPE_LABELS[req.request_type] || req.request_type}"`,
        `"${req.age || ""}"`,
        `"${req.city || ""}"`,
        `"${req.device || ""}"`,
        `"${req.chronic_diseases || ""}"`,
        `"${req.symptoms || ""}"`,
        `"${req.details || ""}"`,
        `"${STATUS_LABELS[req.status]?.text || req.status}"`,
        imgUrl ? `"=HYPERLINK(""${imgUrl}""; ""عرض الصورة"")"` : '""'
      ];
    });

    const csvContent = [headers.join(","), ...rows.map(row => row.join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "AYDA_Requests.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
        alert("خطأ في الدخول: " + error.message)
    } else {
        navigate(0)
    }
    setLoading(false)
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100" dir="rtl">
        <form onSubmit={handleLogin} className="bg-white p-8 rounded-3xl shadow-xl w-96">
          <h2 className="text-2xl font-black mb-6 text-blue-900 text-center">دخول لوحة التحكم</h2>
          <input type="email" placeholder="البريد الإلكتروني" className="w-full p-4 mb-4 border rounded-xl" onChange={(e) => setEmail(e.target.value)} />
          <input type="password" placeholder="كلمة المرور" className="w-full p-4 mb-6 border rounded-xl" onChange={(e) => setPassword(e.target.value)} />
          <button disabled={loading} className="w-full bg-blue-900 text-white py-4 rounded-xl font-bold">{loading ? "جاري الدخول..." : "دخول"}</button>
        </form>
      </div>
    )
  }

  return (
    <div className="p-8 min-h-screen bg-gray-50" dir="rtl">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-black text-blue-900">لوحة تحكم الطلبات</h1>
        <div className="flex gap-3">
          <button onClick={exportToCSV} className="bg-green-600 text-white px-6 py-2 rounded-xl font-bold">تصدير CSV</button>
          <button onClick={() => { supabase.auth.signOut(); navigate(0); }} className="bg-red-500 text-white px-6 py-2 rounded-xl font-bold">خروج</button>
        </div>
      </div>

      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm border">
        <table className="min-w-full text-right">
          <thead className="bg-gray-50">
            <tr>
              <th className="p-4">الاسم</th>
              <th className="p-4">الهاتف</th>
              <th className="p-4">النوع</th>
              <th className="p-4">بيانات المريض</th>
              <th className="p-4">الحالة</th>
              <th className="p-4">إجراء</th>
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-bold">{req.full_name}</td>
                <td className="p-4">{req.phone}</td>
                <td className="p-4">{REQUEST_TYPE_LABELS[req.request_type] || req.request_type}</td>
                <td className="p-4 text-xs text-gray-600">
                  {req.city && <p>المدينة: {req.city}</p>}
                  {req.device && <p>الجهاز: {req.device}</p>}
                  {req.chronic_diseases && <p>أمراض: {req.chronic_diseases}</p>}
                  {req.symptoms && <p>أعراض: {req.symptoms}</p>}
                  {req.image_url && <a href={getImageUrl(req.image_url)} target="_blank" rel="noreferrer" className="text-blue-600 underline font-bold">عرض الروشتة</a>}
                </td>
                <td className="p-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_LABELS[req.status]?.className}`}>{STATUS_LABELS[req.status]?.text}</span>
                </td>
                <td className="p-4 space-x-2 space-x-reverse">
                  <button onClick={() => updateStatus(req.id, 'approved')} className="text-green-600 font-bold ml-3">قبول</button>
                  <button onClick={() => updateStatus(req.id, 'rejected')} className="text-red-600 font-bold">رفض</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}