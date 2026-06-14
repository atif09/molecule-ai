import React from 'react';

const StatusTicker = () => {
  const items = [
    { label: 'System', value: 'Nominal', dot: true },
    { label: 'Models', value: 'RF + Groq LLM Active' },
    { label: 'Queue', value: '0 Active Jobs' },
    { label: 'Backend', value: 'FastAPI / RDKit' },
    { label: 'Version', value: '1.0.0' },
  ];

  return (
    <section className="mt-auto py-4 border-t border-gray-100 px-8 bg-white">
      <div className="flex gap-10 overflow-hidden whitespace-nowrap">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            {item.dot && <span className="w-1.5 h-1.5 rounded-full bg-black inline-block" />}
            <span className="font-mono text-[11px] text-gray-400 uppercase tracking-wider">
              {item.label}:{' '}
              <span className="text-gray-600 font-semibold">{item.value}</span>
            </span>
          </div>
        ))}
      </div>
    </section>
  );
};

export default StatusTicker;
