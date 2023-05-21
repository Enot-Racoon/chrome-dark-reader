import React from "react";

import * as appModel from "entities/app";

export interface DefaultLayoutProps {
  className?: string;
  children: ValOrArr<React.ReactNode>;
}

export const DefaultLayout = React.forwardRef<
  React.FC<DefaultLayoutProps>,
  DefaultLayoutProps
>(function DefaultLayout({ children, className }, ref) {
  appModel.useGate();

  return React.createElement("div", { ref, className }, children);
});
