// Status color mappings and visual indicators for ToolTrack

export const STATUS_CONFIG = {
  Registered: {
    label: 'Registered',
    bg: 'bg-slate-100',
    text: 'text-slate-800',
    border: 'border-slate-300',
    dot: 'bg-slate-500'
  },
  Received: {
    label: 'Received',
    bg: 'bg-sky-100',
    text: 'text-sky-800',
    border: 'border-sky-300',
    dot: 'bg-sky-500'
  },
  Inspected: {
    label: 'Inspected',
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dot: 'bg-blue-600'
  },
  Issued: {
    label: 'Issued',
    bg: 'bg-indigo-100',
    text: 'text-indigo-800',
    border: 'border-indigo-300',
    dot: 'bg-indigo-600'
  },
  'In Use': {
    label: 'In Use',
    bg: 'bg-emerald-100',
    text: 'text-emerald-800',
    border: 'border-emerald-300',
    dot: 'bg-emerald-600'
  },
  Returned: {
    label: 'Returned',
    bg: 'bg-amber-100',
    text: 'text-amber-800',
    border: 'border-amber-300',
    dot: 'bg-amber-600'
  },
  'Sent for Maintenance': {
    label: 'Sent for Maintenance',
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    dot: 'bg-orange-600'
  },
  Repaired: {
    label: 'Repaired',
    bg: 'bg-teal-100',
    text: 'text-teal-800',
    border: 'border-teal-300',
    dot: 'bg-teal-600'
  },
  Retired: {
    label: 'Retired',
    bg: 'bg-zinc-200',
    text: 'text-zinc-700',
    border: 'border-zinc-400',
    dot: 'bg-zinc-500'
  }
};

export function getStatusStyle(status) {
  return STATUS_CONFIG[status] || {
    label: status || 'Unknown',
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    border: 'border-gray-300',
    dot: 'bg-gray-500'
  };
}
