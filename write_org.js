const fs = require('fs');

const code = `import React, { useEffect, useState } from 'react';
import Card from './Card';

const OrgChart = ({ data, onSelect, isAdmin, onMoveCard }) => {
  const [dimensions, setDimensions] = useState({ width: 800, height: 800 });
  const [dragOverSector, setDragOverSector] = useState(null);

  useEffect(() => {
    const handleResize = () => {
      const width = Math.min(window.innerWidth * 0.9, 1000);
      setDimensions({ width, height: width });
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { lideranca, setores } = data;
  const center = { x: dimensions.width / 2, y: dimensions.height / 2 };
  const orbitRadius = dimensions.width * 0.35; 
  
  const handleDragOver = (e, setorName) => {
    e.preventDefault();
    setDragOverSector(setorName);
  };

  const handleDragLeave = () => {
    setDragOverSector(null);
  };

  const handleDrop = (e, setorName) => {
    e.preventDefault();
    setDragOverSector(null);
    const colabId = e.dataTransfer.getData('colabId');
    if (colabId && onMoveCard) {
      onMoveCard(colabId, setorName);
    }
  };

  return (
    <div 
      className="relative flex items-center justify-center" 
      style={{ width: dimensions.width, height: dimensions.height }}
    >
      <div 
        className="absolute z-20 flex flex-col items-center justify-center"
        style={{ 
          left: center.x, 
          top: center.y,
          transform: 'translate(-50%, -50%)'
        }}
      >
        {lideranca.map(lider => (
          <Card key={lider.id} colaborador={lider} onClick={onSelect} isCenter={true} isAdmin={isAdmin} />
        ))}
      </div>

      {(() => {
        const nodes = [];
        const lines = [];

        const renderSector = (s, sX, sY, depth) => (
          <div 
            key={s.nome}
            className={\`absolute z-10 flex flex-col items-center p-4 rounded-xl transition-colors \${dragOverSector === s.nome ? 'bg-laghetto-gold/10 ring-2 ring-laghetto-gold' : ''}\`}
            style={{ 
              left: sX, 
              top: sY,
              transform: \`translate(-50%, -50%) scale(\${Math.max(0.6, 1 - (depth - 1) * 0.15)})\`
            }}
            onDragOver={(e) => handleDragOver(e, s.nome)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, s.nome)}
          >
            <div className="bg-black/60 border border-laghetto-gold/50 text-laghetto-gold px-4 py-1 rounded-full mb-4 text-sm font-bold tracking-wider backdrop-blur-sm whitespace-nowrap">
              {s.nome}
            </div>
            
            <div className="flex flex-wrap justify-center gap-4 w-64 min-h-[160px]">
              {(s.colaboradores || []).map(colab => (
                <div key={colab.id} className="transition-transform hover:z-50">
                   <Card colaborador={colab} onClick={onSelect} isAdmin={isAdmin} />
                </div>
              ))}
            </div>
          </div>
        );

        const processLevel = (list, depth, baseAngle, angleSpread, parentX, parentY, parentAngle) => {
          if (!list || list.length === 0) return;
          
          const radius = orbitRadius + (depth - 1) * (orbitRadius * 0.6);
          
          list.forEach((setor, index) => {
            let angle = baseAngle;
            if (list.length > 1) {
              const offset = (index / (list.length - 1)) * angleSpread - (angleSpread / 2);
              angle = baseAngle + offset;
            }

            const x = center.x + radius * Math.cos(angle);
            const y = center.y + radius * Math.sin(angle);

            nodes.push(renderSector(setor, x, y, depth));

            if (depth === 1) {
              const targetX = center.x + (radius * 0.8) * Math.cos(angle);
              const targetY = center.y + (radius * 0.8) * Math.sin(angle);
              lines.push(
                <line 
                  key={\`line-\${setor.nome}\`}
                  x1={center.x} y1={center.y} 
                  x2={targetX} y2={targetY} 
                  stroke="url(#lineGrad)" strokeWidth="2" strokeDasharray="4 4"
                />
              );
            } else {
              const sxX = center.x + (orbitRadius + (depth - 2) * (orbitRadius * 0.6)) * Math.cos(parentAngle);
              const sxY = center.y + (orbitRadius + (depth - 2) * (orbitRadius * 0.6)) * Math.sin(parentAngle);
              const txX = center.x + (radius * 0.85) * Math.cos(angle);
              const txY = center.y + (radius * 0.85) * Math.sin(angle);
              lines.push(
                <line 
                  key={\`line-\${setor.nome}\`}
                  x1={sxX} y1={sxY} 
                  x2={txX} y2={txY} 
                  stroke="url(#lineGrad)" strokeWidth="1.5" strokeDasharray="2 4"
                />
              );
            }

            if (setor.subsetores && setor.subsetores.length > 0) {
              const nextSpread = angleSpread * 0.6;
              processLevel(setor.subsetores, depth + 1, angle, nextSpread, x, y, angle);
            }
          });
        };

        processLevel(setores, 1, -Math.PI / 2, 2 * Math.PI, center.x, center.y, 0);

        return (
          <>
            {nodes}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0">
              <defs>
                <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f3e5ab" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#f3e5ab" stopOpacity="0.1" />
                </linearGradient>
              </defs>
              {lines}
            </svg>
          </>
        );
      })()}
    </div>
  );
};

export default OrgChart;`;

fs.writeFileSync('c:\\chamados\\org\\laghetto-org-chart\\src\\components\\OrgChart.jsx', code, 'utf-8');
