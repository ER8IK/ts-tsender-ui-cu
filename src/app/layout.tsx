import type { Metadata } from "next";
import "./globals.css";
import { ReactNode } from "react";
import { Providers } from "./providers";
import Header from "@/components/Header";
import AirdropForm from "@/components/AirdropForm";

export const metadata: Metadata = {
  title: "TSender",
};

export default function RootLayout(props: {
  children: React.ReactNode}){
  return (
    <html lang="en">
      <body>
        <Providers>
          <Header />
          <AirdropForm />
          {props.children}
        </Providers>
      </body>
    </html>
  );
}
