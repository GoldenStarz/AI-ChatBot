import "./globals.css";

export const metadata = {
  title: "AI Chatbot",
  description: "A general-purpose AI chatbot built with Next.js, React and Tailwind CSS.",
};

// Runs before first paint so a saved dark theme never flashes light.
const THEME_SCRIPT = `(function(){try{var t=localStorage.getItem('ai-chatbot-theme');if(t==='dark'||(!t&&window.matchMedia('(prefers-color-scheme: dark)').matches)){document.documentElement.classList.add('dark')}}catch(e){}})();`;

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="bg-slate-100 text-slate-900 antialiased dark:bg-slate-950 dark:text-slate-100">
        <script dangerouslySetInnerHTML={{ __html: THEME_SCRIPT }} />
        {children}
      </body>
    </html>
  );
}
