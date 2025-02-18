
type StatusInfo = {
  label: string;
  color: string;
  description: string;
};

export const MESSAGE_STATUS_MAP: Record<string, StatusInfo> = {
  'delivered': {
    label: 'Delivered',
    color: 'bg-green-500/20 text-green-500',
    description: 'Message was successfully delivered'
  },
  'failed': {
    label: 'Failed',
    color: 'bg-red-500/20 text-red-500',
    description: 'Message delivery failed'
  },
  'pending': {
    label: 'Pending',
    color: 'bg-yellow-500/20 text-yellow-500',
    description: 'Message is queued for delivery'
  },
  'sending': {
    label: 'Sending',
    color: 'bg-blue-500/20 text-blue-500',
    description: 'Message is being sent'
  },
  'undelivered': {
    label: 'Undelivered',
    color: 'bg-orange-500/20 text-orange-500',
    description: 'Message could not be delivered'
  }
};

export const getStatusInfo = (status: string | null): StatusInfo => {
  if (!status) {
    return MESSAGE_STATUS_MAP['pending'];
  }
  return MESSAGE_STATUS_MAP[status.toLowerCase()] || {
    label: status,
    color: 'bg-gray-500/20 text-gray-500',
    description: 'Unknown status'
  };
};
