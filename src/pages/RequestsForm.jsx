import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import './RequestPage.css'

export default function RequestPage() {
  const [activeTab, setActiveTab] = useState('prescription')
  const [showOther, setShowOther] = useState(false)
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState(null)

  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    details: '',
    age: '',
    city: '',
    device: '',
    chronic_diseases: '',
    symptoms: ''
  })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)

    let imageUrl = null

    if (activeTab === 'prescription' && file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('prescriptions')
        .upload(fileName, file)

      if (uploadError) {
        alert("خطأ في رفع الصورة: " + uploadError.message)
        setLoading(false)
        return
      }
      imageUrl = uploadData.path
    }

    const { error } = await supabase.from('requests').insert([
      {
        full_name: formData.full_name,
        phone: formData.phone,
        request_type: activeTab,
        age: formData.age || null,
        city: formData.city || null,
        device: formData.device || null,
        chronic_diseases: formData.chronic_diseases || null,
        symptoms: formData.symptoms || null,
        details: formData.details,
        image_url: imageUrl,
        status: 'pending'
      }
    ])

    if (error) {
      alert("خطأ أثناء الإرسال: " + error.message)
    } else {
      alert("تم إرسال طلبك بنجاح!")
      setFormData({ full_name: '', phone: '', details: '', age: '', city: '', device: '', chronic_diseases: '', symptoms: '' })
      setFile(null)
    }
    setLoading(false)
  }

  const tabs = [
    { id: 'prescription', label: 'صرف روشتة' },
    { id: 'convoy', label: 'طلب قافلة' },
    { id: 'medical', label: 'أجهزة طبية' },
    { id: 'consultation', label: 'استشارة طبية' }
  ]

  return (
    <div className="req-page" dir="rtl">
      <div className="req-bg">
        <div className="req-blob b1" />
        <div className="req-blob b2" />
        <div className="req-blob b3" />
      </div>

      <div className="req-content">
        <div className="req-header">
          <span className="req-eyebrow">نموذج طلب</span>
          <h1 className="req-title">مركز طلبات AYDA</h1>
          <p className="req-subtitle">اختر نوع الطلب واملأ البيانات، وفريقنا هيتواصل معاك في أقرب وقت</p>
        </div>

        <div className="req-tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => { setActiveTab(tab.id); setShowOther(false) }}
              className={`req-tab ${activeTab === tab.id ? 'active' : ''}`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="req-card">
          <form onSubmit={handleSubmit} className="req-form">
            <input
              required
              type="text"
              placeholder="الاسم الكريم"
              className="req-input"
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              value={formData.full_name}
            />
            <input
              required
              type="tel"
              placeholder="رقم التليفون للتواصل"
              className="req-input"
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              value={formData.phone}
            />

            {activeTab === 'prescription' && (
              <>
                <input type="number" placeholder="السن" className="req-input" onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                <textarea placeholder="سبب عدم القدرة على الصرف" className="req-textarea" onChange={(e) => setFormData({ ...formData, details: e.target.value })} />
                <label className="req-label">ارفع صورة الروشتة:</label>
                <input type="file" accept="image/*" className="req-file" onChange={(e) => setFile(e.target.files[0])} />
              </>
            )}

            {activeTab === 'convoy' && (
              <>
                <input type="text" placeholder="اسم البلد" className="req-input" onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                <textarea placeholder="أسباب نزول القافلة" className="req-textarea" onChange={(e) => setFormData({ ...formData, details: e.target.value })} />
              </>
            )}

            {activeTab === 'medical' && (
              <>
                <select
                  className="req-input"
                  onChange={(e) => { setShowOther(e.target.value === 'other'); setFormData({ ...formData, device: e.target.value }) }}
                >
                  <option value="">اختر الجهاز المطلوب...</option>
                  <option value="كرسي متحرك">كرسي متحرك</option>
                  <option value="جهاز قياس ضغط">جهاز قياس ضغط</option>
                  <option value="جهاز قياس سكر">جهاز قياس سكر</option>
                  <option value="other">أخرى</option>
                </select>
                {showOther && (
                  <input type="text" placeholder="اكتب اسم الجهاز..." className="req-input" onChange={(e) => setFormData({ ...formData, device: e.target.value })} />
                )}
                <textarea placeholder="أسباب عدم القدرة على الشراء" className="req-textarea" onChange={(e) => setFormData({ ...formData, details: e.target.value })} />
              </>
            )}

            {activeTab === 'consultation' && (
              <>
                <input type="number" placeholder="السن" className="req-input" onChange={(e) => setFormData({ ...formData, age: e.target.value })} />
                <input type="text" placeholder="الأمراض المزمنة (إن وجدت)" className="req-input" onChange={(e) => setFormData({ ...formData, chronic_diseases: e.target.value })} />
                <textarea placeholder="الأعراض التي تشكو منها بالتفصيل" className="req-textarea" onChange={(e) => setFormData({ ...formData, symptoms: e.target.value })} />
              </>
            )}

            <button disabled={loading} type="submit" className="req-submit">
              {loading ? "جاري الإرسال..." : "إرسال الطلب"}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}