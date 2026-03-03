import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { DollarSign, Users, ShieldCheck, Calculator, AlertCircle, ArrowRight, Target, HelpCircle } from 'lucide-react';

type HeadcountTier = '1-2' | '3-5' | '>5';
type SalaryTier = '<15k' | '15k-30k' | '30k-50k' | '>50k';

export default function App() {
  const [activeTab, setActiveTab] = useState<'method1' | 'method2'>('method1');
  const [method1SubTab, setMethod1SubTab] = useState<'forward' | 'reverse'>('forward');
  
  // Forward & Method 2 State
  const [salaryStr, setSalaryStr] = useState('');
  const [warranty, setWarranty] = useState<number>(1);
  const [headcountTier, setHeadcountTier] = useState<HeadcountTier>('1-2');
  
  // Method 2 Weights
  const [weightSalaryStr, setWeightSalaryStr] = useState('0.2');
  const [weightWarrantyStr, setWeightWarrantyStr] = useState('0.6');
  const [weightHeadcountStr, setWeightHeadcountStr] = useState('0.2');
  
  // Reverse State
  const [revSalaryTier, setRevSalaryTier] = useState<SalaryTier>('15k-30k');
  const [revTargetFeeStr, setRevTargetFeeStr] = useState('22');
  const [revSolveFor, setRevSolveFor] = useState<'warranty' | 'headcount'>('warranty');
  const [revWarranty, setRevWarranty] = useState<number>(1);
  const [revHeadcountTier, setRevHeadcountTier] = useState<HeadcountTier>('1-2');

  // --- Calculations for Forward & Method 2 ---
  const salaryNum = parseInt(salaryStr.replace(/\D/g, ''), 10) || 0;
  const displaySalary = salaryStr ? Number(salaryStr.replace(/\D/g, '')).toLocaleString('en-US') : '';
  
  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '');
    setSalaryStr(val);
  };

  const baseline = 20;
  
  const getSalaryAdj = (num: number) => {
    if (num === 0) return 0;
    if (num < 15000) return 0.5;
    if (num <= 30000) return 0;
    if (num <= 50000) return -0.5;
    return -1.0;
  };

  const getSalaryTierAdj = (tier: SalaryTier) => {
    switch (tier) {
      case '<15k': return 0.5;
      case '15k-30k': return 0;
      case '30k-50k': return -0.5;
      case '>50k': return -1.0;
    }
  };

  const getWarrantyAdj = (months: number) => {
    switch (months) {
      case 0: return -1.0;
      case 1: return 0;
      case 2: return 1.0;
      case 3: return 2.0;
      default: return 0;
    }
  };

  const getHeadcountAdj = (tier: HeadcountTier) => {
    switch (tier) {
      case '1-2': return 0;
      case '3-5': return -1.0;
      case '>5': return -2.0;
    }
  };

  const adjSalary = getSalaryAdj(salaryNum);
  const adjWarranty = getWarrantyAdj(warranty);
  const adjHeadcount = getHeadcountAdj(headcountTier);

  const weightSalary = parseFloat(weightSalaryStr) || 0;
  const weightWarranty = parseFloat(weightWarrantyStr) || 0;
  const weightHeadcount = parseFloat(weightHeadcountStr) || 0;
  const totalWeight = Number((weightSalary + weightWarranty + weightHeadcount).toFixed(2));
  const isWeightValid = totalWeight === 1.0;

  let rawTotal = baseline;
  if (activeTab === 'method1') {
    rawTotal = baseline + adjSalary + adjWarranty + adjHeadcount;
  } else {
    rawTotal = baseline + (adjSalary * weightSalary) + (adjWarranty * weightWarranty) + (adjHeadcount * weightHeadcount);
  }

  const finalTotal = Math.max(18, Math.min(25, rawTotal));
  const isCapped = rawTotal > 25;
  const isFloored = rawTotal < 18;
  const hasValidInputs = salaryNum > 0;

  // --- Calculations for Reverse ---
  const revTargetFee = parseFloat(revTargetFeeStr) || 20;
  const revAdjSalary = getSalaryTierAdj(revSalaryTier);
  
  let reverseResultText = '';
  
  if (revSolveFor === 'warranty') {
    const revAdjHeadcount = getHeadcountAdj(revHeadcountTier);
    const requiredAdjWarranty = revTargetFee - baseline - revAdjSalary - revAdjHeadcount;
    
    // Find closest warranty
    const warrantyOptions = [
      { months: 0, adj: -1.0, label: '0 months' },
      { months: 1, adj: 0, label: '1 month' },
      { months: 2, adj: 1.0, label: '2 months' },
      { months: 3, adj: 2.0, label: '3 months' }
    ];
    
    let closest = warrantyOptions[0];
    let minDiff = Math.abs(requiredAdjWarranty - closest.adj);
    for (const opt of warrantyOptions) {
      const diff = Math.abs(requiredAdjWarranty - opt.adj);
      if (diff < minDiff) {
        minDiff = diff;
        closest = opt;
      }
    }
    
    const achievedFee = baseline + revAdjSalary + revAdjHeadcount + closest.adj;
    const finalAchievedFee = Math.max(18, Math.min(25, achievedFee));
    
    reverseResultText = `To reach a ~${finalAchievedFee.toFixed(1)}% fee, you need to offer a ${closest.label} Warranty.`;
    if (Math.abs(achievedFee - revTargetFee) > 0.1) {
      reverseResultText += ` (Exact ${revTargetFee}% is not possible with these tiers).`;
    }
  } else {
    const revAdjWarranty = getWarrantyAdj(revWarranty);
    const requiredAdjHeadcount = revTargetFee - baseline - revAdjSalary - revAdjWarranty;
    
    // Find closest headcount
    const headcountOptions = [
      { tier: '1-2', adj: 0, label: '1-2 positions' },
      { tier: '3-5', adj: -1.0, label: '3-5 positions' },
      { tier: '>5', adj: -2.0, label: '>5 positions' }
    ];
    
    let closest = headcountOptions[0];
    let minDiff = Math.abs(requiredAdjHeadcount - closest.adj);
    for (const opt of headcountOptions) {
      const diff = Math.abs(requiredAdjHeadcount - opt.adj);
      if (diff < minDiff) {
        minDiff = diff;
        closest = opt;
      }
    }
    
    const achievedFee = baseline + revAdjSalary + revAdjWarranty + closest.adj;
    const finalAchievedFee = Math.max(18, Math.min(25, achievedFee));
    
    reverseResultText = `To reach a ~${finalAchievedFee.toFixed(1)}% fee, you need a volume of ${closest.label}.`;
    if (Math.abs(achievedFee - revTargetFee) > 0.1) {
      reverseResultText += ` (Exact ${revTargetFee}% is not possible with these tiers).`;
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans text-slate-800">
      
      {/* Sidebar */}
      <div className="w-80 bg-slate-900 text-slate-300 flex flex-col h-full overflow-y-auto shrink-0 shadow-xl z-10">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold flex items-center text-white">
            <Calculator className="mr-3 text-emerald-400" size={24} />
            Fee Calculator
          </h1>
        </div>
        
        <div className="p-4 space-y-2">
          <button
            onClick={() => setActiveTab('method1')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
              activeTab === 'method1' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            Method 1: Simple
            {activeTab === 'method1' && <ArrowRight size={16} />}
          </button>
          <button
            onClick={() => setActiveTab('method2')}
            className={`w-full text-left px-4 py-3 rounded-xl font-medium transition-all flex items-center justify-between ${
              activeTab === 'method2' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                : 'hover:bg-slate-800 hover:text-white border border-transparent'
            }`}
          >
            Method 2: Weighted
            {activeTab === 'method2' && <ArrowRight size={16} />}
          </button>
        </div>

        <div className="mt-4 px-6 pb-8 flex-1">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 flex items-center">
            <HelpCircle size={14} className="mr-2" />
            How it works
          </h3>
          
          <div className="space-y-4">
            {/* Salary Card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden text-sm">
              <div className="bg-slate-800 px-3 py-2 font-semibold text-slate-200 flex items-center text-xs">
                <DollarSign size={14} className="mr-1.5 text-slate-400" />
                Salary Adjustment
              </div>
              <div className="divide-y divide-slate-700/50">
                <div className="flex justify-between px-3 py-1.5"><span>&lt; $15k</span><span className="text-rose-400">+0.5%</span></div>
                <div className="flex justify-between px-3 py-1.5"><span>$15k - $30k</span><span className="text-slate-400">0%</span></div>
                <div className="flex justify-between px-3 py-1.5"><span>$30k - $50k</span><span className="text-emerald-400">-0.5%</span></div>
                <div className="flex justify-between px-3 py-1.5"><span>&gt; $50k</span><span className="text-emerald-400">-1.0%</span></div>
              </div>
            </div>

            {/* Warranty Card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden text-sm">
              <div className="bg-slate-800 px-3 py-2 font-semibold text-slate-200 flex items-center text-xs">
                <ShieldCheck size={14} className="mr-1.5 text-slate-400" />
                Warranty Adjustment
              </div>
              <div className="divide-y divide-slate-700/50">
                <div className="flex justify-between px-3 py-1.5"><span>0 months</span><span className="text-emerald-400">-1.0%</span></div>
                <div className="flex justify-between px-3 py-1.5"><span>1 month</span><span className="text-slate-400">0%</span></div>
                <div className="flex justify-between px-3 py-1.5"><span>2 months</span><span className="text-rose-400">+1.0%</span></div>
                <div className="flex justify-between px-3 py-1.5"><span>3 months</span><span className="text-rose-400">+2.0%</span></div>
              </div>
            </div>

            {/* Headcount Card */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg overflow-hidden text-sm">
              <div className="bg-slate-800 px-3 py-2 font-semibold text-slate-200 flex items-center text-xs">
                <Users size={14} className="mr-1.5 text-slate-400" />
                Headcounts
              </div>
              <div className="divide-y divide-slate-700/50">
                <div className="flex justify-between px-3 py-1.5"><span>1 - 2 pos</span><span className="text-slate-400">0%</span></div>
                <div className="flex justify-between px-3 py-1.5"><span>3 - 5 pos</span><span className="text-emerald-400">-1.0%</span></div>
                <div className="flex justify-between px-3 py-1.5"><span>&gt; 5 pos</span><span className="text-emerald-400">-2.0%</span></div>
              </div>
            </div>
            
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg p-3 text-xs text-slate-400">
              <p>Baseline: <strong className="text-slate-200">20%</strong></p>
              <p>Floor: <strong className="text-slate-200">18%</strong> | Cap: <strong className="text-slate-200">25%</strong></p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full overflow-y-auto">
        <div className="max-w-3xl mx-auto w-full p-8 lg:p-12 space-y-8">
          
          <header className="mb-8">
            <h2 className="text-3xl font-bold text-slate-900 tracking-tight">
              {activeTab === 'method1' ? 'Simple Baseline' : 'Weighted Baseline'}
            </h2>
            <p className="text-slate-500 mt-2 text-lg">
              {activeTab === 'method1' 
                ? 'Calculate fees using straightforward additive adjustments.' 
                : 'Calculate fees using custom weightings for each factor.'}
            </p>
          </header>

          {activeTab === 'method1' && (
            <div className="flex space-x-2 bg-slate-200/50 p-1.5 rounded-xl w-fit mb-8">
              <button
                onClick={() => setMethod1SubTab('forward')}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  method1SubTab === 'forward' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                }`}
              >
                Forward Calculation
              </button>
              <button
                onClick={() => setMethod1SubTab('reverse')}
                className={`px-6 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                  method1SubTab === 'reverse' 
                    ? 'bg-white text-slate-900 shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-200'
                }`}
              >
                Reverse Calculation
              </button>
            </div>
          )}

          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
            
            {/* --- FORWARD & METHOD 2 --- */}
            {(activeTab === 'method2' || (activeTab === 'method1' && method1SubTab === 'forward')) && (
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-8 space-y-8">
                  {/* Salary Input */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                      <DollarSign size={18} className="mr-1.5 text-slate-400" />
                      Annual Gross Salary
                    </label>
                    <div className="flex items-start space-x-4">
                      <div className="relative flex-1 flex items-center">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                          <span className="text-slate-400 font-medium text-lg">$</span>
                        </div>
                        <input
                          type="text"
                          value={displaySalary}
                          onChange={handleSalaryChange}
                          className="block w-full pl-9 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-lg font-medium text-slate-900 placeholder:text-slate-400"
                          placeholder="0"
                        />
                      </div>
                      {activeTab === 'method2' && (
                        <div className="w-24 shrink-0">
                          <input
                            type="number"
                            step="0.1"
                            value={weightSalaryStr}
                            onChange={(e) => setWeightSalaryStr(e.target.value)}
                            className="block w-full px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-center text-lg font-medium text-slate-900"
                            placeholder="Wt"
                          />
                          <div className="text-[10px] text-center text-slate-400 mt-1.5 font-bold uppercase tracking-wider">Weight</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Warranty Dropdown */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                      <ShieldCheck size={18} className="mr-1.5 text-slate-400" />
                      Warranty Period
                    </label>
                    <div className="flex items-start space-x-4">
                      <div className="relative flex-1 flex items-center">
                        <select
                          value={warranty}
                          onChange={(e) => setWarranty(Number(e.target.value))}
                          className="block w-full py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-lg font-medium text-slate-900 appearance-none cursor-pointer"
                        >
                          <option value={0}>0 Months</option>
                          <option value={1}>1 Month</option>
                          <option value={2}>2 Months</option>
                          <option value={3}>3 Months</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      {activeTab === 'method2' && (
                        <div className="w-24 shrink-0">
                          <input
                            type="number"
                            step="0.1"
                            value={weightWarrantyStr}
                            onChange={(e) => setWeightWarrantyStr(e.target.value)}
                            className="block w-full px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-center text-lg font-medium text-slate-900"
                            placeholder="Wt"
                          />
                          <div className="text-[10px] text-center text-slate-400 mt-1.5 font-bold uppercase tracking-wider">Weight</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Headcount Dropdown */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                      <Users size={18} className="mr-1.5 text-slate-400" />
                      Number of Headcounts
                    </label>
                    <div className="flex items-start space-x-4">
                      <div className="relative flex-1 flex items-center">
                        <select
                          value={headcountTier}
                          onChange={(e) => setHeadcountTier(e.target.value as HeadcountTier)}
                          className="block w-full py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-lg font-medium text-slate-900 appearance-none cursor-pointer"
                        >
                          <option value="1-2">1 - 2 positions</option>
                          <option value="3-5">3 - 5 positions</option>
                          <option value=">5">&gt; 5 positions</option>
                        </select>
                        <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                          <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                          </svg>
                        </div>
                      </div>
                      {activeTab === 'method2' && (
                        <div className="w-24 shrink-0">
                          <input
                            type="number"
                            step="0.1"
                            value={weightHeadcountStr}
                            onChange={(e) => setWeightHeadcountStr(e.target.value)}
                            className="block w-full px-3 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-center text-lg font-medium text-slate-900"
                            placeholder="Wt"
                          />
                          <div className="text-[10px] text-center text-slate-400 mt-1.5 font-bold uppercase tracking-wider">Weight</div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Weight Warning */}
                  {activeTab === 'method2' && (
                    <div className={`flex items-center justify-between p-4 rounded-xl border ${isWeightValid ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 'bg-rose-50 border-rose-100 text-rose-700'}`}>
                      <div className="flex items-center font-medium">
                        {!isWeightValid && <AlertCircle size={18} className="mr-2" />}
                        Total Weight
                      </div>
                      <div className="font-bold text-lg">{totalWeight.toFixed(2)}</div>
                    </div>
                  )}
                </div>

                {/* Result Panel */}
                <div className="md:w-72 bg-slate-50 border-t md:border-t-0 md:border-l border-slate-200 p-8 flex flex-col justify-center items-center text-center relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                  
                  {activeTab === 'method2' && !isWeightValid ? (
                    <div className="py-6">
                      <p className="text-rose-500 font-medium flex flex-col items-center justify-center text-center">
                        <AlertCircle size={32} className="mb-3 opacity-80" />
                        Total weight must equal 1.0 to calculate
                      </p>
                    </div>
                  ) : (
                    <>
                      <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Final Service Fee</p>
                      <div className="text-7xl font-extrabold text-emerald-600 tracking-tight">
                        {finalTotal.toFixed(2)}<span className="text-4xl text-emerald-500/70">%</span>
                      </div>
                      
                      <div className="h-8 mt-4 flex items-center justify-center">
                        {(isCapped || isFloored) && hasValidInputs && (
                          <span className="text-sm font-medium text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                            {isCapped ? 'Capped at 25%' : 'Floored at 18%'}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* --- REVERSE CALCULATION --- */}
            {activeTab === 'method1' && method1SubTab === 'reverse' && (
              <div className="flex flex-col md:flex-row">
                <div className="flex-1 p-8 space-y-8">
                  
                  {/* Target Fee Input */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                      <Target size={18} className="mr-1.5 text-slate-400" />
                      Target Service Fee %
                    </label>
                    <div className="relative flex items-center">
                      <input
                        type="number"
                        step="0.1"
                        value={revTargetFeeStr}
                        onChange={(e) => setRevTargetFeeStr(e.target.value)}
                        className="block w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-lg font-medium text-slate-900"
                        placeholder="22"
                      />
                      <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                        <span className="text-slate-400 font-medium text-lg">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Salary Tier Dropdown */}
                  <div>
                    <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                      <DollarSign size={18} className="mr-1.5 text-slate-400" />
                      Annual Gross Salary Range
                    </label>
                    <div className="relative flex items-center">
                      <select
                        value={revSalaryTier}
                        onChange={(e) => setRevSalaryTier(e.target.value as SalaryTier)}
                        className="block w-full py-3.5 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 focus:bg-white transition-all text-lg font-medium text-slate-900 appearance-none cursor-pointer"
                      >
                        <option value="<15k">&lt; $15,000</option>
                        <option value="15k-30k">$15,000 - $30,000</option>
                        <option value="30k-50k">$30,001 - $50,000</option>
                        <option value=">50k">&gt; $50,000</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                        <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                          <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* Solve For Selection */}
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200">
                    <label className="block text-sm font-semibold text-slate-700 mb-4">
                      What do you want to solve for?
                    </label>
                    <div className="flex space-x-4 mb-6">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="solveFor" 
                          value="warranty" 
                          checked={revSolveFor === 'warranty'} 
                          onChange={() => setRevSolveFor('warranty')}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <span className="font-medium text-slate-700">Warranty Period</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input 
                          type="radio" 
                          name="solveFor" 
                          value="headcount" 
                          checked={revSolveFor === 'headcount'} 
                          onChange={() => setRevSolveFor('headcount')}
                          className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 border-slate-300"
                        />
                        <span className="font-medium text-slate-700">Number of Headcounts</span>
                      </label>
                    </div>

                    {/* Conditional Input based on Solve For */}
                    {revSolveFor === 'warranty' ? (
                      <div>
                        <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                          <Users size={16} className="mr-1.5 text-slate-400" />
                          Known Headcounts
                        </label>
                        <div className="relative flex items-center">
                          <select
                            value={revHeadcountTier}
                            onChange={(e) => setRevHeadcountTier(e.target.value as HeadcountTier)}
                            className="block w-full py-3.5 px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-base font-medium text-slate-900 appearance-none cursor-pointer"
                          >
                            <option value="1-2">1 - 2 positions</option>
                            <option value="3-5">3 - 5 positions</option>
                            <option value=">5">&gt; 5 positions</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <label className="flex items-center text-sm font-semibold text-slate-700 mb-2">
                          <ShieldCheck size={16} className="mr-1.5 text-slate-400" />
                          Known Warranty Period
                        </label>
                        <div className="relative flex items-center">
                          <select
                            value={revWarranty}
                            onChange={(e) => setRevWarranty(Number(e.target.value))}
                            className="block w-full py-3.5 px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all text-base font-medium text-slate-900 appearance-none cursor-pointer"
                          >
                            <option value={0}>0 Months</option>
                            <option value={1}>1 Month</option>
                            <option value={2}>2 Months</option>
                            <option value={3}>3 Months</option>
                          </select>
                          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                              <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Reverse Result Panel */}
                <div className="md:w-80 bg-slate-900 text-white p-8 flex flex-col justify-center items-center text-center relative">
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-emerald-600"></div>
                  
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-6">Required Action</p>
                  
                  <div className="text-xl font-medium leading-relaxed text-slate-200">
                    {reverseResultText}
                  </div>
                  
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
