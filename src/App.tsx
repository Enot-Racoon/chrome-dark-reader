import React from "react";
import logo from "./logo.svg";
import "./App.css";

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1 className="text-3xl font-bold underline">Hello Tailwind css!</h1>
        <img src={logo} className="App-logo" alt="logo" />
        <button className="btn">Hello daisyUI</button>
      </header>
    </div>
  );
}

export default App;
