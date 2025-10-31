'use client';

export default function Terms() {
  return (
    <div className="min-h-screen bg-black text-[#f8f8f8]">
      <main className="max-w-3xl mx-auto px-6 py-16">
        <h1 className="text-4xl font-bold mb-4">Terms & Conditions</h1>
        <p className="text-gray-400 mb-10">Last updated: {new Date().getFullYear()}</p>

        <section className="space-y-6 text-gray-300 leading-relaxed">
          <p>
            Welcome to Slopcel. By accessing or using the site, you agree to these terms. This
            project is a parody service with no uptime guarantees and no warranty of any kind.
          </p>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Use of Service</h2>
            <ul className="list-disc pl-6 space-y-2">
              <li>Do not submit illegal or harmful content.</li>
              <li>We may refuse or remove any submission for any reason.</li>
              <li>Paid submissions are non-refundable unless required by law.</li>
            </ul>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Intellectual Property</h2>
            <p>You retain rights to your ideas; you grant us permission to display and host them.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Limitation of Liability</h2>
            <p>Slopcel is provided “as-is.” We are not liable for damages arising from use.</p>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white mb-2">Changes</h2>
            <p>We may update these terms at any time. Continued use means you accept the changes.</p>
          </div>
        </section>

        <div className="mt-12">
          <a href="/" className="btn-secondary">Back to Home</a>
        </div>
      </main>
    </div>
  );
}


