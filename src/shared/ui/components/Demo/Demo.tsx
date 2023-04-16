import React from "react";

import logo from "shared/ui/assets/logo.svg";

import "./Demo.css";

export default function Demo({ children }: React.PropsWithChildren) {
  return (
    <div className="Demo">
      <header className="Demo-header">
        <h1 className="text-3xl font-bold underline">Hello Tailwind css!</h1>
        <button className="btn">Hello daisyUI</button>
        <img src={logo} className="Demo-logo" alt="logo" />
        {children}
        <button className="bg-gray-200 shadow-xl rounded-xl p-4">
          <span className="bg-gray-300 rounded-xl p-4">Кнопка</span>
        </button>
      </header>
    </div>
  );
}
