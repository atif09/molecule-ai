import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
  const navigate = useNavigate();
  const canvasRef = useRef(null);
  const [searchValue, setSearchValue] = useState('');

  // Molecule Canvas Animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let molecules = [];
    let mouse = { x: null, y: null };
    let animationFrameId;

    const init = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      molecules = [];
      for (let i = 0; i < 60; i++) {
        molecules.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 20 + 10,
          speedX: Math.random() * 0.4 - 0.2,
          speedY: Math.random() * 0.4 - 0.2,
          rotation: Math.random() * Math.PI * 2,
          rotSpeed: Math.random() * 0.01 - 0.005,
          type: Math.floor(Math.random() * 6)
        });
      }
    };

    const handleMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };

    const drawMolecule = (m) => {
      ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.save();
      ctx.translate(m.x, m.y);
      ctx.rotate(m.rotation);

      const s = m.size;

      if (m.type === 0) {
        // Benzene ring
        for (let i = 0; i < 6; i++) {
          let x = s * Math.cos(i * Math.PI / 3);
          let y = s * Math.sin(i * Math.PI / 3);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else if (m.type === 1) {
        // Zigzag carbon chain
        ctx.moveTo(-s, 0);
        ctx.lineTo(-s / 2, s / 2);
        ctx.lineTo(0, 0);
        ctx.lineTo(s / 2, s / 2);
        ctx.lineTo(s, 0);
      } else if (m.type === 2) {
        // Benzene ring with a side chain (like toluene)
        for (let i = 0; i < 6; i++) {
          let x = s * Math.cos(i * Math.PI / 3);
          let y = s * Math.sin(i * Math.PI / 3);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        ctx.moveTo(s, 0);
        ctx.lineTo(s + s * 0.6, -s * 0.5);
        ctx.lineTo(s + s * 1.2, 0);
      } else if (m.type === 3) {
        // Five-membered ring (furan/pyrrole style)
        for (let i = 0; i < 5; i++) {
          let x = s * Math.cos(i * 2 * Math.PI / 5 - Math.PI / 2);
          let y = s * Math.sin(i * 2 * Math.PI / 5 - Math.PI / 2);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else if (m.type === 4) {
        // Double-ring fused (naphthalene-like)
        for (let i = 0; i < 6; i++) {
          let x = s * Math.cos(i * Math.PI / 3);
          let y = s * Math.sin(i * Math.PI / 3);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
        const ox = s * 1.5;
        ctx.moveTo(ox + s * Math.cos(0), s * Math.sin(0));
        for (let i = 0; i < 6; i++) {
          let x = ox + s * Math.cos(i * Math.PI / 3);
          let y = s * Math.sin(i * Math.PI / 3);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.closePath();
      } else {
        // Branched structure (amino acid backbone style)
        ctx.moveTo(-s, 0);
        ctx.lineTo(0, 0);
        ctx.lineTo(s, 0);
        ctx.moveTo(0, 0);
        ctx.lineTo(0, -s);
        ctx.moveTo(s, 0);
        ctx.lineTo(s + s * 0.5, s * 0.5);
        ctx.moveTo(s, 0);
        ctx.lineTo(s + s * 0.5, -s * 0.5);
      }

      ctx.stroke();
      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      molecules.forEach(m => {
        m.x += m.speedX;
        m.y += m.speedY;
        m.rotation += m.rotSpeed;

        if (mouse.x && mouse.y) {
          let dx = mouse.x - m.x;
          let dy = mouse.y - m.y;
          let dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            m.x -= dx * 0.01;
            m.y -= dy * 0.01;
          }
        }

        if (m.x < 0) m.x = canvas.width;
        if (m.x > canvas.width) m.x = 0;
        if (m.y < 0) m.y = canvas.height;
        if (m.y > canvas.height) m.y = 0;

        drawMolecule(m);
      });
      animationFrameId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('resize', init);
    init();
    animate();

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', init);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('opacity-100', 'translate-y-0');
          entry.target.classList.remove('opacity-0', 'translate-y-20');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleLaunch = () => navigate('/analyzer');

  return (
    <div className="bg-white text-gray-900 selection:bg-black/10 min-h-screen font-sans">
      {/* Molecular Background Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0 hidden md:block" />

      {/* TopNavBar */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-black flex justify-between items-center px-8 py-4">
        <div className="text-xl font-bold tracking-tighter text-black">MoleculeAI</div>
        <div className="hidden md:flex gap-8 items-center tracking-tight text-sm font-medium">
          <a className="text-black border-b border-black pb-1" href="#how-it-works">How it works</a>
          <a className="text-gray-400 hover:text-black transition-colors" href="#">Targets</a>
          <a className="text-gray-400 hover:text-black transition-colors" href="#">Insights</a>
          <a className="text-gray-400 hover:text-black transition-colors" href="#">Documentation</a>
        </div>
        <button
          onClick={handleLaunch}
          className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-800 active:scale-95 transition-all"
        >
          Launch Analyzer
        </button>
      </nav>

      <main className="relative z-10 pt-32">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-8 flex flex-col items-center text-center">
          <h1 className="text-5xl md:text-7xl font-bold tracking-tighter mb-6 leading-[1.1] text-black">
            Analyze any molecule. <br />
            <span className="text-gray-400">Instantly.</span>
          </h1>
          <p className="max-w-2xl text-gray-500 text-lg mb-12">
            From molecule name to full binding affinity, ADMET profile, and 3D optimization. Precision-engineered for molecular researchers.
          </p>
          <div className="w-full max-w-xl p-1 flex items-center mb-10 border border-black">
            <div className="px-4 text-gray-400">
              <span className="material-symbols-outlined">search</span>
            </div>
            <input
              className="bg-transparent border-none focus:ring-0 w-full font-mono text-sm text-black placeholder:text-gray-400 outline-none"
              placeholder="Try: Aspirin, Imatinib, or SMILES string..."
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleLaunch()}
            />
            <button
              onClick={handleLaunch}
              className="bg-black text-white px-6 py-3 font-bold text-sm shrink-0 hover:bg-gray-800 transition-colors"
            >
              ANALYZE
            </button>
          </div>
          <div className="flex gap-4">
            <button className="px-6 py-2 text-sm font-bold text-black border border-black hover:bg-black hover:text-white transition-colors">See how it works</button>
          </div>
        </section>

        {/* Stats Strip */}
        <section className="mt-32 border-y border-black py-12">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { val: '<1s', label: 'Analysis time' },
              { val: '12', label: 'Molecular descriptors' },
              { val: '4', label: 'Protein targets' },
              { val: '3', label: 'AI models' },
            ].map(({ val, label }) => (
              <div key={label} className="flex flex-col items-center md:items-start">
                <span className="font-mono text-2xl font-bold text-black mb-1">{val}</span>
                <span className="font-mono text-[10px] uppercase tracking-widest text-gray-400">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline (How it works) */}
        <section id="how-it-works" className="py-32 max-w-7xl mx-auto px-8 reveal opacity-0 translate-y-20 transition-all duration-700">
          <h2 className="font-mono text-[12px] uppercase tracking-[0.3em] text-gray-400 mb-16 text-center">Protocol Workflow</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 relative">
            {[
              { num: '01', icon: 'input', title: 'Input', desc: 'Provide SMILES, IUPAC name, or CID. Our resolver handles chemical normalization automatically.' },
              { num: '02', icon: 'rebase_edit', title: 'Resolve', desc: 'Structural parsing using RDKit kernels ensures valency validation and tautomer selection.' },
              { num: '03', icon: 'memory', title: 'Compute', desc: 'Parallel inference across graph neural networks predicts binding energy and pharmacokinetic params.' },
              { num: '04', icon: 'monitoring', title: 'Interpret', desc: 'Export publication-ready data cards including ADMET toxicity radars and binding scores.' }
            ].map((step, i) => (
              <div key={i} className="flex flex-col gap-4 relative">
                <div className="text-[64px] font-bold font-mono text-black/[0.04] leading-none absolute -top-10 -left-4 select-none">{step.num}</div>
                <div className="w-12 h-12 border border-black flex items-center justify-center">
                  <span className="material-symbols-outlined text-black">{step.icon}</span>
                </div>
                <h3 className="font-bold text-lg text-black">{step.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Results Preview */}
        <section className="py-32 bg-gray-50 border-y border-black reveal opacity-0 translate-y-20 transition-all duration-700">
          <div className="max-w-7xl mx-auto px-8 grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            <div className="space-y-8">
              <h2 className="text-4xl font-bold tracking-tight text-black">Full-Spectrum <br />Molecular Profiling</h2>
              <div className="space-y-4">
                {[
                  'Molecule Identity & Validation',
                  "Binding Affinity Prediction (pKd)",
                  "Lipinski's Rule of Five Check",
                  'ADMET Profile Analysis',
                  'Solubility & Permeability',
                  'Synthesis Accessibility (SA) Score'
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-4 py-4 border-b border-gray-200 group">
                    <span className="font-mono text-gray-300 transition-colors group-hover:text-black">0{i + 1}</span>
                    <span className="font-medium text-gray-500 group-hover:text-black transition-colors">{item}</span>
                  </div>
                ))}
              </div>
            </div>
            {/* Mock Results Card */}
            <div className="bg-white p-8 border border-black shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
              <div className="flex justify-between items-start mb-12">
                <div>
                  <span className="font-mono text-[10px] uppercase text-gray-400 block mb-1">Target Analysis</span>
                  <h3 className="text-2xl font-bold text-black">Imatinib Mesylate</h3>
                </div>
                <div className="px-3 py-1 font-mono text-[12px] border border-black text-gray-500">CID: 5291</div>
              </div>
              <div className="relative h-64 mb-12 bg-gray-50 flex items-center justify-center border border-gray-200 overflow-hidden">
                <img
                  className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale"
                  src="https://images.unsplash.com/photo-1532187875605-1ef6ec23916d?auto=format&fit=crop&q=80&w=1000"
                  alt="molecules"
                />
                <div className="z-10 flex flex-col items-center">
                  <div className="text-5xl font-bold font-mono text-black">8.42</div>
                  <div className="font-mono text-[10px] uppercase tracking-widest text-gray-400 mt-2">pKd Affinity Score</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { label: 'MW', val: '493.6 g/mol' },
                  { label: 'LogP', val: '4.50' },
                  { label: 'H-Bond Donors', val: '2' },
                  { label: 'H-Bond Acceptors', val: '7' },
                ].map(({ label, val }) => (
                  <div key={label} className="space-y-1">
                    <div className="font-mono text-[10px] text-gray-400 uppercase tracking-widest">{label}</div>
                    <div className="font-mono text-sm text-black font-semibold">{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Protein Targets */}
        <section className="py-32 max-w-7xl mx-auto px-8 reveal opacity-0 translate-y-20 transition-all duration-700">
          <div className="flex justify-between items-end mb-16">
            <div>
              <h2 className="text-4xl font-bold tracking-tight mb-4 text-black">Core Protein Targets</h2>
              <p className="text-gray-500">Validated benchmarks for cross-docking precision.</p>
            </div>
            <button className="px-4 py-2 border border-black text-sm font-mono flex items-center gap-2 hover:bg-black hover:text-white transition-all text-gray-500">
              VIEW ALL TARGETS <span className="material-symbols-outlined">north_east</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { badge: 'COVID-19', id: '6LU7', name: 'Main Protease', desc: 'Inhibition of SARS-CoV-2 viral replication cycle.', color: 'red' },
              { badge: 'CML', id: '2HYY', name: 'Abl Kinase', desc: 'Target for Chronic Myeloid Leukemia therapies.', color: 'blue' },
              { badge: "Alzheimer's", id: '1EVE', name: 'AChE', desc: 'Acetylcholinesterase inhibition studies.', color: 'yellow' },
              { badge: 'Diabetes', id: '2J78', name: 'PTP1B', desc: 'Protein tyrosine phosphatase for insulin resistance.', color: 'green' }
            ].map((t, i) => (
              <div key={i} className="bg-white p-6 border border-black hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-10">
                  <div className={`px-2 py-0.5 text-[10px] font-mono uppercase border ${
                    t.color === 'red' ? 'bg-red-50 text-red-700 border-red-200' :
                    t.color === 'blue' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    t.color === 'yellow' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                    'bg-green-50 text-green-700 border-green-200'
                  }`}>{t.badge}</div>
                  <div className="font-mono text-lg font-bold text-gray-300 group-hover:text-black transition-colors">{t.id}</div>
                </div>
                <h4 className="font-bold mb-2 text-black">{t.name}</h4>
                <p className="text-xs text-gray-400 mb-6 leading-relaxed">{t.desc}</p>
                <button
                  onClick={handleLaunch}
                  className="text-xs font-mono uppercase tracking-widest flex items-center gap-2 text-gray-300 group-hover:text-black transition-all outline-none"
                >
                  Analyze Target <span className="material-symbols-outlined text-[14px]">arrow_forward</span>
                </button>
              </div>
            ))}
          </div>
        </section>


        {/* Final CTA */}
        <section className="py-40 max-w-4xl mx-auto px-8 text-center reveal opacity-0 translate-y-20 transition-all duration-700">
          <h2 className="text-5xl font-bold tracking-tighter mb-8 text-black leading-tight">Ready to analyze a molecule?</h2>
          <p className="text-gray-500 text-lg mb-12">Join 400+ pharmaceutical research teams using MoleculeAI to accelerate lead identification.</p>
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={handleLaunch}
              className="px-12 py-5 bg-black text-white font-bold text-lg hover:bg-gray-800 transition-all active:scale-95"
            >
              Start Discovery Free
            </button>
            <div className="font-mono text-[11px] text-gray-400 tracking-wider">
              GET /api/v1/analyze?smiles=CC(=O)OC1=CC=CC=C1C(=O)O
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-black mt-20 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12 px-12 py-16">
          <div className="col-span-1">
            <div className="text-lg font-bold text-black mb-4">MoleculeAI</div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-gray-400 leading-relaxed">
              Molecular Intelligence Editorial. <br /> Precision Brutalism Framework.
            </p>
          </div>
          <div className="space-y-4">
            <h5 className="font-mono text-[10px] text-black uppercase tracking-widest font-bold">Navigation</h5>
            <ul className="space-y-2">
              <li><button onClick={handleLaunch} className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors">Analyzer</button></li>
              <li><a className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors" href="#">Benchmarks</a></li>
              <li><a className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors" href="#">Documentation</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="font-mono text-[10px] text-black uppercase tracking-widest font-bold">Legal</h5>
            <ul className="space-y-2">
              <li><a className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors" href="#">Privacy Policy</a></li>
              <li><a className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors" href="#">Terms of Service</a></li>
              <li><a className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors" href="#">Security</a></li>
            </ul>
          </div>
          <div className="space-y-4">
            <h5 className="font-mono text-[10px] text-black uppercase tracking-widest font-bold">Access</h5>
            <ul className="space-y-2">
              <li><a className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors" href="#">API Access</a></li>
              <li><a className="font-mono text-[10px] uppercase tracking-widest text-gray-400 hover:text-black transition-colors" href="#">Contact Support</a></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-12 pb-8 border-t border-gray-100 pt-8">
          <p className="font-mono text-[10px] uppercase tracking-widest text-gray-300">
            © 2026 MoleculeAI. All rights reserved. Precision-Engineered for Drug Discovery.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
