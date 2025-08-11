import React, { useState, useEffect, useRef } from "react";
import { supabase } from '../../supabaseClient';
import { Range } from 'react-range';

const salaryAverages = [
  { value: 15, count: 2 },
  { value: 18, count: 8 },
  { value: 20, count: 15 },
  { value: 22, count: 10 },
  { value: 24, count: 5 },
];

const minSalary = 15;
const maxSalary = 24;
const units = ["hour", "month", "year"];

// Salary distribution bins for each unit
const salaryDistributions = {
  hour: [
    { label: '10-11', min: 10, max: 11, percent: 7.57 },
    { label: '11-12', min: 11, max: 12, percent: 5.13 },
    { label: '12-13', min: 12, max: 13, percent: 3.00 },
    { label: '13-14', min: 13, max: 14, percent: 6.41 },
    { label: '14-15', min: 14, max: 15, percent: 10.96 },
    { label: '15-16', min: 15, max: 16, percent: 16.46 },
    { label: '16-17', min: 16, max: 17, percent: 19.85 },
    { label: '17-18', min: 17, max: 18, percent: 12.84 },
    { label: '18-19', min: 18, max: 19, percent: 8.71 },
    { label: '19-20', min: 19, max: 20, percent: 6.08 },
    { label: '20-21', min: 20, max: 21, percent: 4.29 },
    { label: '21-22', min: 21, max: 22, percent: 3.76 },
    { label: '22-23', min: 22, max: 23, percent: 3.02 },
    { label: '23-24', min: 23, max: 24, percent: 4.28 },
    { label: '24-25', min: 24, max: 25, percent: 5.85 },
    { label: '25-26', min: 25, max: 26, percent: 4.74 },
    { label: '26-27', min: 26, max: 27, percent: 3.64 },
    { label: '27-28', min: 27, max: 28, percent: 2.53 },
    { label: '28-29', min: 28, max: 29, percent: 2.43 },
    { label: '29-30', min: 29, max: 30, percent: 2.02 },
    { label: '30-31', min: 30, max: 31, percent: 1.92 },
    { label: '31-32', min: 31, max: 32, percent: 1.77 },
  ],
  month: [
    { label: '1600–1863', min: 1600, max: 1863, percent: 7.04 },
    { label: '1864–2127', min: 1864, max: 2127, percent: 5.29 },
    { label: '2128–2390', min: 2128, max: 2390, percent: 3.98 },
    { label: '2391–2654', min: 2391, max: 2654, percent: 5.28 },
    { label: '2655–2918', min: 2655, max: 2918, percent: 5.62 },
    { label: '2919–3181', min: 2919, max: 3181, percent: 6.31 },
    { label: '3182–3445', min: 3182, max: 3445, percent: 4.49 },
    { label: '3446–3708', min: 3446, max: 3708, percent: 3.61 },
    { label: '3709–3972', min: 3709, max: 3972, percent: 7.03 },
    { label: '3973–4236', min: 3973, max: 4236, percent: 9.99 },
    { label: '4237–4499', min: 4237, max: 4499, percent: 10.46 },
    { label: '4500–4763', min: 4500, max: 4763, percent: 7.07 },
    { label: '4764–5026', min: 4764, max: 5026, percent: 5.21 },
    { label: '5027–5290', min: 5027, max: 5290, percent: 4.51 },
    { label: '5291–5554', min: 5291, max: 5554, percent: 3.96 },
    { label: '5555–5817', min: 5555, max: 5817, percent: 2.66 },
    { label: '5818–6081', min: 5818, max: 6081, percent: 1.55 },
    { label: '6082–6344', min: 6082, max: 6344, percent: 2.12 },
    { label: '6345–6608', min: 6345, max: 6608, percent: 1.17 },
    { label: '6609–6872', min: 6609, max: 6872, percent: 1.73 },
    { label: '6873–7135', min: 6873, max: 7135, percent: 1.29 },
    { label: '7136–7399', min: 7136, max: 7399, percent: 1.04 },
  ],
  year: [
    { label: '19200–22365', min: 19200, max: 22365, percent: 1.04 },
    { label: '22366–25530', min: 22366, max: 25530, percent: 1.29 },
    { label: '25531–28696', min: 25531, max: 28696, percent: 1.98 },
    { label: '28697–31861', min: 28697, max: 31861, percent: 3.28 },
    { label: '31862–35027', min: 31862, max: 35027, percent: 3.62 },
    { label: '35028–38192', min: 35028, max: 38192, percent: 4.31 },
    { label: '38193–41358', min: 38193, max: 41358, percent: 4.49 },
    { label: '41359–44523', min: 41359, max: 44523, percent: 5.61 },
    { label: '44524–47688', min: 44524, max: 47688, percent: 6.03 },
    { label: '47689–50854', min: 47689, max: 50854, percent: 6.99 },
    { label: '50855–54019', min: 50855, max: 54019, percent: 8.46 },
    { label: '54020–57184', min: 54020, max: 57184, percent: 9.07 },
    { label: '57185–60350', min: 57185, max: 60350, percent: 8.21 },
    { label: '60351–63515', min: 60351, max: 63515, percent: 7.51 },
    { label: '63516–66680', min: 63516, max: 66680, percent: 5.96 },
    { label: '66681–69846', min: 66681, max: 69846, percent: 4.66 },
    { label: '69847–73011', min: 69847, max: 73011, percent: 3.55 },
    { label: '73012–76176', min: 73012, max: 76176, percent: 3.12 },
    { label: '76177–79342', min: 76177, max: 79342, percent: 2.17 },
    { label: '79343–82507', min: 79343, max: 82507, percent: 1.73 },
    { label: '82508–85673', min: 82508, max: 85673, percent: 1.29 },
    { label: '85674–88838', min: 85674, max: 88838, percent: 1.04 },
  ],
};

// Update unitConfig to ensure one-line formatting
const unitConfig = {
  hour: { min: 10, max: 35, step: 1, format: (v: number) => `$${v}` },
  month: { min: 1600, max: 7399, step: 1, format: (v: number) => `$${Math.round(v)}` },
  year: { min: 19200, max: 88838, step: 1, format: (v: number) => `$${Math.round(v)}` },
};

// Helper to interpolate the distribution into 15 bins
function getHistogramBins(unit: 'hour'|'month'|'year', numBins = 15) {
  const bins = [];
  const dist = salaryDistributions[unit];
  const { min, max } = unitConfig[unit];
  const binWidth = (max - min) / numBins;
  let distIdx = 0;
  let distStart = dist[0].min;
  let distEnd = dist[0].max;
  let distPercent = dist[0].percent;
  let distRange = distEnd - distStart;
  let usedPercent = 0;
  for (let i = 0; i < numBins; i++) {
    const binStart = min + i * binWidth;
    const binEnd = binStart + binWidth;
    // Find which dist bin this falls into
    while (binStart >= distEnd && distIdx < dist.length - 1) {
      usedPercent += distPercent;
      distIdx++;
      distStart = dist[distIdx].min;
      distEnd = dist[distIdx].max;
      distPercent = dist[distIdx].percent;
      distRange = distEnd - distStart;
    }
    // Proportion of this bin in the current dist bin
    const overlap = Math.max(0, Math.min(binEnd, distEnd) - Math.max(binStart, distStart));
    const percent = overlap > 0 && distRange > 0 ? (overlap / distRange) * distPercent : 0;
    bins.push(percent);
  }
  // Normalize so max is 100 for visual
  const maxVal = Math.max(...bins, 1);
  return bins.map(v => (v / maxVal) * 100);
}

interface SalaryRangeSectionProps {
  salaryMin: number;
  salaryMax: number;
  onSalaryUpdated: (salaryMin: number, salaryMax: number) => void;
}

const SalaryRangeSection: React.FC<SalaryRangeSectionProps> = ({ salaryMin, salaryMax, onSalaryUpdated }) => {
  const [unit, setUnit] = useState<'hour'|'month'|'year'>('hour');
  const [range, setRange] = useState<[number, number]>([salaryMin, salaryMax]);
  const barRef = useRef<HTMLDivElement>(null);
  const [isUserInteraction, setIsUserInteraction] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setRange([salaryMin, salaryMax]);
    // Reset user interaction flag when props change (indicating this is not user interaction)
    setIsUserInteraction(false);
  }, [salaryMin, salaryMax]);

  useEffect(() => {
    // Reset range when unit changes
    setRange([unitConfig[unit].min, unitConfig[unit].max]);
    setIsUserInteraction(false);
  }, [unit]);

  // Calculate bar positions
  const barWidth = 320;
  const getX = (val: number) => ((val - minSalary) / (maxSalary - minSalary)) * barWidth;

  // Update parent when range changes from props (not user interaction)
  useEffect(() => {
    if (!isUserInteraction) {
      onSalaryUpdated(range[0], range[1]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, isUserInteraction]);

  // Handle slider changes
  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMin = Math.min(Number(e.target.value), range[1] - 1);
    setIsUserInteraction(true);
    setRange([newMin, range[1]]);
    
    // Debounced save to Supabase (5 seconds)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase
          .from('profiles')
          .update({ salary_min: newMin, salary_max: range[1] })
          .eq('id', userData.user.id);
      }
    }, 5000);
  };
  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newMax = Math.max(Number(e.target.value), range[0] + 1);
    setIsUserInteraction(true);
    setRange([range[0], newMax]);
    
    // Debounced save to Supabase (5 seconds)
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(async () => {
      const { data: userData } = await supabase.auth.getUser();
      if (userData.user) {
        await supabase
          .from('profiles')
          .update({ salary_min: range[0], salary_max: newMax })
          .eq('id', userData.user.id);
      }
    }, 5000);
  };

  return (
    <div className="w-full rounded-[2rem] border-4 border-gray-300 px-6 py-5 flex flex-col gap-4 bg-white">
      <div className="relative w-full max-w-[420px] flex flex-col items-center mx-auto pt-16 px-2 min-w-0">
        {/* Histogram bars (behind slider, flush with bottom) */}
        <div className="absolute left-0 w-full flex flex-row items-end h-16 z-0 min-w-0" style={{ bottom: '0px', pointerEvents: 'none' }}>
          {salaryDistributions[unit].map((bin, i, arr) => {
            const inRange = bin.max > range[0] && bin.min < range[1];
            const maxPercent = Math.max(...arr.map(b => b.percent), 1);
            return (
              <div
                key={i}
                style={{
                  height: `${(bin.percent / maxPercent) * 100}%`,
                  width: `calc((100% - ${(arr.length - 1)} * 2px) / ${arr.length})`,
                  minWidth: '2px',
                  marginLeft: i === 0 ? 0 : '2px',
                  marginRight: 0,
                  background: inRange ? 'linear-gradient(180deg, rgba(162,89,255,0.7) 0%, rgba(108,43,215,0.7) 100%)' : 'rgba(209,213,219,0.5)',
                  borderTopLeftRadius: '6px',
                  borderTopRightRadius: '6px',
                  borderBottomLeftRadius: 0,
                  borderBottomRightRadius: 0,
                  alignSelf: 'flex-end',
                  transition: 'height 0.2s, background 0.2s',
                }}
              />
            );
          })}
        </div>
        {/* Range slider (thinner line, flush with bottom of bars, above bars) */}
        <div className="relative w-full h-4 flex items-end z-0 min-w-0" style={{ position: 'relative', bottom: 0 }}>
          <Range
            step={unitConfig[unit].step}
            min={unitConfig[unit].min}
            max={unitConfig[unit].max}
            values={range}
            onChange={(values) => {
              setIsUserInteraction(true);
              setRange([values[0], values[1]]);
              
              // Debounced save to Supabase (5 seconds)
              if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
              }
              saveTimeoutRef.current = setTimeout(async () => {
                const { data: userData } = await supabase.auth.getUser();
                if (userData.user) {
                  await supabase
                    .from('profiles')
                    .update({ salary_min: values[0], salary_max: values[1] })
                    .eq('id', userData.user.id);
                }
              }, 5000);
            }}
            renderTrack={({ props, children }) => (
              <div
                {...props}
                key={undefined}
                className="absolute left-0 bottom-0 w-full h-1 bg-gray-200/60 rounded-full z-40"
                style={{ ...props.style }}
              >
                <div
                  className="absolute bg-gradient-to-r from-[#A259FF] to-[#6C2BD7] h-1 rounded-full"
                  style={{
                    left: `${((range[0] - unitConfig[unit].min) / (unitConfig[unit].max - unitConfig[unit].min)) * 100}%`,
                    width: `${((range[1] - range[0]) / (unitConfig[unit].max - unitConfig[unit].min)) * 100}%`,
                    top: 0,
                    height: '100%',
                    zIndex: 41,
                  }}
                />
                {children}
              </div>
            )}
            renderThumb={({ props, isDragged }) => {
              const { key, ...otherProps } = props;
              return (
                <div
                  key={key}
                  {...otherProps}
                  className={`w-4 h-4 bg-white border border-purple-400 rounded-full shadow-none transition-all duration-150 flex items-center justify-center ${isDragged ? 'scale-105' : ''}`}
                  style={{ ...otherProps.style, zIndex: 50, boxShadow: 'none', borderWidth: 1 }}
                />
              );
            }}
          />
        </div>
      </div>
      {/* Min/Max labels below slider, Airbnb style, now smaller and centered under slider ends */}
      <div className="flex flex-row items-center w-full max-w-[420px] mt-2 mx-auto gap-x-3 min-w-0 justify-between">
        {/* Minimum */}
        <div className="flex flex-col items-center flex-1 min-w-0">
          <span className="text-gray-500 text-xs mb-0.5">Minimum</span>
          <div className="rounded-full border border-gray-300 px-4 py-1 text-sm font-semibold bg-white text-gray-800 whitespace-nowrap flex items-center justify-center text-center min-w-[56px] min-h-[36px]">
            {unitConfig[unit].format(range[0])}
          </div>
        </div>
        {/* Unit selector centered */}
        <div className="flex flex-col items-center flex-1 min-w-0">
          <span className="text-white text-xs mb-0.5 select-none" style={{height: '16px'}}>&nbsp;</span>
          <div className="relative flex items-center justify-center min-h-[36px] w-full">
            <select
              className="appearance-none bg-purple-100 text-purple-700 font-semibold rounded-full px-4 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 border border-purple-400 pr-6 cursor-pointer text-center min-h-[36px] w-full max-w-[140px] flex items-center justify-center"
              value={unit}
              onChange={e => setUnit(e.target.value as 'hour'|'month'|'year')}
              style={{ boxShadow: 'none' }}
            >
              {units.map(u => (
                <option key={u} value={u}>/{u}</option>
              ))}
            </select>
          </div>
        </div>
        {/* Maximum */}
        <div className="flex flex-col items-center flex-1 min-w-0">
          <span className="text-gray-500 text-xs mb-0.5">Maximum</span>
          <div className="rounded-full border border-gray-300 px-4 py-1 text-sm font-semibold bg-white text-gray-800 whitespace-nowrap flex items-center justify-center text-center min-w-[56px] min-h-[36px]">
            {unitConfig[unit].format(range[1])}
          </div>
        </div>
      </div>
      <style>{`
        input[type='range'].slider-thumb-min::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #A259FF;
          box-shadow: 0 2px 8px 0 rgba(162,89,255,0.15);
          cursor: pointer;
          z-index: 30;
        }
        input[type='range'].slider-thumb-max::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #fff;
          border: 2px solid #6C2BD7;
          box-shadow: 0 2px 8px 0 rgba(108,43,215,0.15);
          cursor: pointer;
          z-index: 30;
        }
        input[type='range']::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
        }
        input[type='range']::-ms-fill-lower,
        input[type='range']::-ms-fill-upper {
          background: transparent;
        }
        input[type='range'] {
          background: transparent;
        }
      `}</style>
    </div>
  );
};

export default SalaryRangeSection; 