import React from "react";

import logo from "../../assets/logo.svg";

import "./Demo.css";

export default function Demo({ children }: React.PropsWithChildren) {
  return (
    <div className="Demo">
      <header className="Demo-header">
        <h1 className="text-3xl font-bold underline">Hello Tailwind css!</h1>
        <button className="btn">Hello daisyUI</button>
        <img src={logo} className="Demo-logo" alt="logo" />
        {children}
      </header>
    </div>
  );
}
