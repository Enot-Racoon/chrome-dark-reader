import React from "react";

export interface DefaultLayoutProps {
  children: ValOrArr<React.ReactNode>;
}

export const DefaultLayout = React.forwardRef<
  React.FC<DefaultLayoutProps>,
  DefaultLayoutProps
>(function DefaultLayout({ children }, ref) {
  return React.createElement("div", { ref }, children);
});
