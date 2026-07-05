export default function MedicineCardSkeleton() {
  return (
    <li className="medtracker-list-item skeleton-card" aria-hidden="true">
      <div className="skeleton skeleton-pill"></div>
      <div className="skeleton skeleton-date"></div>
      <div className="skeleton skeleton-time"></div>
      <div className="skeleton skeleton-icon"></div>
      <div className="skeleton skeleton-btn"></div>
    </li>
  );
}
