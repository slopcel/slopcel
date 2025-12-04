'use client';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-black text-[#f8f8f8]">
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Privacy Policy</h1>
        <p className="text-gray-400 mb-10">Last updated: {new Date().getFullYear()}</p>

        <section className="space-y-6 text-gray-300 leading-relaxed">
          <p>
            Slopcel is a parody project. We intentionally keep data collection to a minimum. If you
            contact us or submit an idea, we may store your message and contact details to reply.
          </p>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Information We Collect</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Basic contact info you provide (e.g., email, handle, idea submissions)</li>
              <li>Non-identifying analytics (page views, device type, rough geolocation)</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">How We Use Information</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>To review ideas and respond to messages</li>
              <li>To understand site usage and improve the experience</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Data Sharing</h2>
            <p>We do not sell your data. We may use third-party analytics and hosting providers.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Contact</h2>
            <p>Questions? Reach out on X/Twitter at <a href="https://x.com/_madiou" target="_blank" className="underline">@_madiou</a>.</p>
          </div>
        </section>

        <div className="mt-12">
          <a href="/" className="btn-secondary">Back to Home</a>
        </div>
      </main>
    </div>
  );
}


