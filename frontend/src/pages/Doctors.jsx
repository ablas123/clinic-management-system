const handleSubmit = async (e) => {
  e.preventDefault();
  setSubmitting(true);
  setError('');

  try {
    // ✅ إرسال الحقول بأسماء الـ Schema
    const response = await api.post('/doctors', {
      name: `${formData.firstName} ${formData.lastName}`.trim(),  // ← دمج الاسم
      email: formData.email,
      phone: formData.phone,
      specialty: formData.specialization,  // ← specialty بدلاً من specialization
      bio: formData.licenseNumber,  // ← bio بدلاً من licenseNumber
      isAvailable: formData.isAvailable
    });

    console.log('✅ Response:', response.data);

    if (response.data?.success) {
      setDoctors([response.data.data?.doctor, ...doctors]);
      setShowForm(false);
      setFormData({ firstName: '', lastName: '', email: '', phone: '', specialization: '', licenseNumber: '', isAvailable: true });
    }
  } catch (err) {
    console.error('❌ Error creating doctor:', err);
    const msg = err.response?.data?.message || 'فشل إضافة الطبيب';
    setError(msg);
    if (err.response?.status === 401) {
      logout();
      navigate('/login');
    }
  } finally {
    setSubmitting(false);
  }
};