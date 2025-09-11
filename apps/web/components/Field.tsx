import React from "react";

const Field = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <label className="flex flex-col gap-2">
    <span className="text-xs uppercase tracking-widest text-white/50">
      {label}
    </span>
    {children}
  </label>
);

export default Field;
