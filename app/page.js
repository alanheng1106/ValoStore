"use client";

import LoginForm from "@/components/LoginForm";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-[#0F1923]">
      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-[#FF4655]/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#00D4AA]/10 blur-[150px] rounded-full"></div>
      </div>

      <div className="absolute top-4 right-4 z-20">
        <LanguageSwitcher />
      </div>

      <main className="w-full max-w-md p-6 relative z-10">
        <div className="text-center mb-10">
          <h1 className="text-5xl font-bold tracking-wider text-[#FF4655] mb-2">ValoStore</h1>
          <p className="text-gray-400">Daily Store & Match History</p>
        </div>

        <div className="bg-[#1A2332]/80 backdrop-blur-xl border border-white/5 p-8 rounded-2xl shadow-2xl">
          <LoginForm />
        </div>
      </main>
    </div>
  );
}
