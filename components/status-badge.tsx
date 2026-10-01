import { cn } from '@/lib/utils';
import { PropertyStatus, ApprovalStatus, PROPERTY_STATUS_LABELS, APPROVAL_STATUS_LABELS } from '@/lib/types';

const statusStyles: Record<PropertyStatus, string> = {
  available: 'bg-emerald-500/90 text-white',
  reserved: 'bg-amber-500/90 text-white',
  sold: 'bg-red-500/90 text-white',
  unpublished: 'bg-gray-500/90 text-white',
};

const approvalStyles: Record<ApprovalStatus, string> = {
  pending: 'bg-amber-500/90 text-white',
  approved: 'bg-emerald-500/90 text-white',
  rejected: 'bg-red-500/90 text-white',
};

export function StatusBadge({ status, className }: { status: PropertyStatus; className?: string }) {
  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold backdrop-blur', statusStyles[status], className)}>
      {PROPERTY_STATUS_LABELS[status]}
    </span>
  );
}

export function ApprovalBadge({ status, className }: { status: ApprovalStatus; className?: string }) {
  return (
    <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', approvalStyles[status], className)}>
      {APPROVAL_STATUS_LABELS[status]}
    </span>
  );
}
