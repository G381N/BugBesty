import React from "react";

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-4xl font-bold text-center mb-16 gradient-text">
          How It Works
        </h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12">
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-primary">1</span>
            </div>
            <h3 className="text-xl font-semibold mb-4">Enter Target Domain</h3>
            <p className="text-foreground opacity-70">
              Simply input your target domain and let BugBesty handle the rest.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-primary">2</span>
            </div>
            <h3 className="text-xl font-semibold mb-4">Automated Scanning</h3>
            <p className="text-foreground opacity-70">
              Our system automatically discovers subdomains and initiates vulnerability scanning.
            </p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-6">
              <span className="text-2xl font-bold text-primary">3</span>
            </div>
            <h3 className="text-xl font-semibold mb-4">Track Progress</h3>
            <p className="text-foreground opacity-70">
              Monitor your findings and generate comprehensive reports.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
} 