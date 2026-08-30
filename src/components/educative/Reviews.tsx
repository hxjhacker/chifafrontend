import { REVIEWS } from "@/lib/educative";
import { ReviewGrid } from "@/components/reviews/ReviewCard";

export function Reviews() {
  return (
    <ReviewGrid
      title="آباء وأمهات جرّبوها"
      subtitle="تقييمات مشترين حقيقيين بعد التوصيل والمعاينة."
      reviews={REVIEWS}
    />
  );
}
