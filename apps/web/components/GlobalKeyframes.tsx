const GlobalKeyframes = () => {
  if (
    typeof document !== "undefined" &&
    !document.getElementById("showra-app-kf")
  ) {
    const style = document.createElement("style");
    style.id = "showra-app-kf";
    style.innerHTML = `
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px);} to { opacity: 1; transform: translateY(0);} }
        .icon-btn{ display:grid; place-items:center; height:28px; width:28px; border-radius:8px; background:rgba(255,255,255,.10); color:rgba(255,255,255,.85); }
        .icon-btn:hover{ background:rgba(255,255,255,.18); }
        .icon-btn.danger{ background:rgba(244,63,94,.22); color:#fecaca; }
        .field{ width:100%; border-radius:12px; border:1px solid rgba(255,255,255,.1); background:rgba(255,255,255,.06); padding:.5rem .75rem; font-size:.9rem; color:white; }
        .field::placeholder{ color:rgba(255,255,255,.45); }
        .field:focus{ outline:none; box-shadow:0 0 0 2px rgba(34,211,238,.35); }
      `;
    document.head.appendChild(style);
  }
  return null;
};

export default GlobalKeyframes;
