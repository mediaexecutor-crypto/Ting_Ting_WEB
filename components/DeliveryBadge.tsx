import { OrderStatus } from '@/lib/types';
import { getDeliveryCountdown } from '@/lib/deliveryCountdown';

export default function DeliveryBadge({
  deliveryDate,
  status,
}: {
  deliveryDate: string;
  status: OrderStatus;
}) {
  const badge = getDeliveryCountdown(deliveryDate, status);
  if (!badge) return null;

  return (
    <div
      style={{
        display: 'inline-block',
        marginTop: 4,
        padding: '2px 7px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: badge.bg,
        color: badge.color,
      }}
    >
      {badge.text}
    </div>
  );
}
