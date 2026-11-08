const ACCOUNT_ERROR_MESSAGES: Record<string, string> = {
  invalid_body: "تعذر قراءة البيانات المرسلة. أعدي المحاولة.",
  not_authenticated: "انتهت الجلسة. سجّلي الدخول من جديد.",
  admin_not_configured: "حساب الإدارة غير مهيأ على الخادم.",
  username_required: "اسم المستخدم مطلوب (حرفين على الأقل).",
  username_too_long: "اسم المستخدم طويل جداً.",
  invalid_email: "البريد الإلكتروني غير صالح.",
  current_password_required: "أدخلي كلمة المرور الحالية لتأكيد تعديل الحساب.",
  password_fields_required: "لتغيير كلمة المرور، عمّري الحالية والجديدة وتأكيدها.",
  password_too_short: "كلمة المرور الجديدة يجب أن تكون 8 حروف على الأقل.",
  password_mismatch: "تأكيد كلمة المرور لا يطابق الكلمة الجديدة.",
  password_must_change: "كلمة المرور الجديدة يجب أن تكون مختلفة عن الحالية.",
  invalid_current_password: "كلمة المرور الحالية غير صحيحة.",
  password_update_failed: "تعذر حفظ كلمة المرور. حاولي مرة أخرى.",
  profile_update_failed: "تعذر حفظ بيانات الحساب. حاولي مرة أخرى.",
};

export function accountErrorMessage(detail?: string, status?: number) {
  if (detail && ACCOUNT_ERROR_MESSAGES[detail]) return ACCOUNT_ERROR_MESSAGES[detail];
  if (status === 401) return ACCOUNT_ERROR_MESSAGES.not_authenticated;
  if (status && status >= 500) return "تعذر الاتصال بالخادم. حاولي مرة أخرى.";
  return "تعذر حفظ التعديلات. تحققي من الحقول ثم أعدي المحاولة.";
}
